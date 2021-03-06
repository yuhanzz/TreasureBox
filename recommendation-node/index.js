const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')
const uint8ArrayFromString = require('uint8arrays/from-string')
const uint8ArrayToString = require('uint8arrays/to-string')

const config = require('./config.json');
const bootstrapMultiaddrs = config['bootstrapMultiaddrs'];

const superagent = require('superagent');

// ethereum
var Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/82364750ca284a0d965c78ded806c582'));

var contractABI = [
    {
        "inputs": [],
        "name": "last_completed_migration",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "completed",
                "type": "uint256"
            }
        ],
        "name": "setCompleted",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "category",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "shipping",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "price",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "seller",
                "type": "address"
            }
        ],
        "name": "makeOrder",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "seller",
                "type": "address"
            }
        ],
        "name": "retrieveOrderHistory",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            },
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            },
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            },
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            },
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            },
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
]

var contractAddress = "0x590660C69508a5B4f6e70e450516Bad17A7DD691";

var contractInstance = new web3.eth.Contract(contractABI, contractAddress);


// pubsub
require('dotenv').config()
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub({ projectId: 'treasurebox-313320' });

// Global variables
var node;
var request_index = 0;
var queryMap = new Map();
var responseMap = new Map();
var myPeerId;
const p2pAddress = '/ip4/0.0.0.0/tcp/'
var p2pPort = 15003

// Helper functions
function P2PmessageToObject(message) {
    return JSON.parse(uint8ArrayToString(message.data))
}

function ObjectToP2Pmessage(message) {
    return uint8ArrayFromString(JSON.stringify(message));
}

// query ID is peerId + timestamp + request_index, example: QmPtbwUx8wLRwzZyFtWjTJvJCCv1ZonHcUdj1uTv373aKc-1619730560381-0
function generateQueryId() {
    const current_index = request_index;

    // update request_index
    if (request_index == Number.MAX_SAFE_INTEGER) {
        request_index = 0;
    } else {
        request_index++;
    }

    return myPeerId + `-` + (new Date()).getTime() + `-` + current_index;
}

function handleQueryHit(messageBody) {
    const messageQueryId = messageBody['queryId'];

    if (queryMap.has(messageQueryId)) {
        const providerPeerId = messageBody['from'];
        const requestMessageBody = queryMap.get(messageQueryId);
        node.pubsub.publish(providerPeerId, ObjectToP2Pmessage(requestMessageBody));
        queryMap.delete(messageQueryId);
    }
}

function handleSearchItemResponse(messageBody) {
    const queryId = messageBody['queryId'];
    responseMap.set(queryId, messageBody);
}

// P2P response will be put into responseMap when received, this function wait for that condition. 
function ensureResponseArrives(queryId, timeout) {
    var start = Date.now();
    return new Promise(waitForResponse);

    function waitForResponse(resolve, reject) {
        if (responseMap.has(queryId))
            resolve(responseMap.get(queryId));
        else if (timeout && (Date.now() - start) >= timeout)
            reject(new Error("timeout"));
        else
            setTimeout(waitForResponse.bind(this, resolve, reject), 30);
    }
}

async function triggerNewRecommendation(messageBody) {
    var queryId = generateQueryId();
    var queryMessageBody = {
        longitude: messageBody['longitude'],
        latitude: messageBody['latitude'],
        from: myPeerId,
        queryId: queryId,
        type: 'search_item_request'
    }

    var requestMessageBody = queryMessageBody;

    // Record the query in the queryMap
    queryMap.set(queryId, requestMessageBody);

    // Send p2p message
    node.pubsub.publish('search_item_query', ObjectToP2Pmessage(queryMessageBody));

    // Wait for response
    var itemList;
    await ensureResponseArrives(queryId, 1000000).then(function () {
        itemList = responseMap.get(queryId)['data'];
        responseMap.delete(queryId);
    });

    console.log('all nearby items')
    console.log(itemList)

    const messageToLambda = {
        username: messageBody['userId'],
        data: itemList
    }

    if (itemList.length < 2) {
	console.log('nearby items less than two')
	console.log(itemList)
        const recommendationMessage = {
            type: 'new_recommendation',
            data: itemList
        }
	node.pubsub.publish(messageBody['from'], ObjectToP2Pmessage(recommendationMessage));
	return;
    }

    // filter itemList with machine learning model
    superagent.post('https://74iwvx8mbg.execute-api.us-east-1.amazonaws.com/test/recommendation')
        .send(messageToLambda)
        .end((err, res) => {
            if (err) { return console.log(err); }
	    var recommendedIds = res.body['recommend'];

            itemList.filter((item) => item.id in recommendedIds);

            console.log('filtered by machine learning')
            console.log(itemList)

            itemList.sort(async function (itemA, itemB) {
                const sellerA = itemA['seller'];
                const sellerB = itemB['seller'];
                // rpc to ethereum
                const sellerASoldCount = await getSoldItemCount(sellerA);
                const sellerBSoldCount = await getSoldItemCount(sellerB);
        
                return sellerASoldCount - sellerBSoldCount;
            });
	    console.log('sorted by ethereum data')
	    console.log(itemList)
        
            const recommendationMessage = {
                type: 'new_recommendation',
                data: itemList
            }
            node.pubsub.publish(messageBody['from'], ObjectToP2Pmessage(recommendationMessage));
        });

}

async function addNewUser(userId) {

    const topic = pubSubClient.topic(userId);
    const subscription = topic.subscription(userId);

    try {
        await subscription.get({ autoCreate: true }, async (err, t) => {
            subscription.on('message', message => {
                console.log(message.data.toString())
                const messageBody = JSON.parse(message.data.toString());
                console.log('Received new location:', messageBody);
                triggerNewRecommendation(messageBody);
                message.ack();
            })
        })
    } catch (e) {

    }
}

async function handleInitialRecommendationRequest(messageBody) {
    const newUserId = messageBody['userId']
    const buyerPeerId = messageBody['from']
    const queryId = messageBody['queryId']

    await addNewUser(newUserId);
    const responseMessageBody = {
        from: myPeerId,
        queryId: queryId,
        type: 'initial_recommendation_response'
    }

    node.pubsub.publish(buyerPeerId, ObjectToP2Pmessage(responseMessageBody))
}

async function getSoldItemCount(sellerAddress) {
    var soldCount = 0;
    await contractInstance.methods.retrieveOrderHistory(sellerAddress).call(function (error, result) {
        if (error) {
            console.log('error');
            console.log(error);
        }
        // console.log(result);
        soldCount = result[0].length;
    });
    return soldCount;
}

const createNode = async (bootstrapers) => {
    const node = await Libp2p.create({
        addresses: {
            listen: [p2pAddress + p2pPort]
        },
        modules: {
            transport: [TCP],
            streamMuxer: [Mplex],
            connEncryption: [NOISE],
            pubsub: Gossipsub,
            peerDiscovery: [Bootstrap, PubsubPeerDiscovery]
        },
        config: {
            peerDiscovery: {
                [PubsubPeerDiscovery.tag]: {
                    interval: 1000, // might be too frequent
                    enabled: true
                },
                [Bootstrap.tag]: {
                    enabled: true,
                    list: bootstrapers
                }
            }
        }
    })

    return node
}

async function startPeer() {

    try {
        node = await createNode(bootstrapMultiaddrs)
        myPeerId = node.peerId.toB58String();

        // peer discovery, for debugging
        node.on('peer:discovery', (foundPeerId) => {
            console.log(`Peer ${myPeerId} discovered: ${foundPeerId.toB58String()}`)
        })

        // listeners
        node.pubsub.on('recommendation_query', (msg) => {
            console.log('message title: recommendation_query')
            const queryMessageBody = P2PmessageToObject(msg);
            console.log(queryMessageBody);
            const responseMessageBody = {
                type: 'recommendation_query_hit',
                queryId: queryMessageBody['queryId'],
                from: myPeerId
            }
            node.pubsub.publish(queryMessageBody['from'], ObjectToP2Pmessage(responseMessageBody))
        })

        node.pubsub.on(myPeerId, async (msg) => {
            // console.log('message title: my peer id')
            const messageBody = P2PmessageToObject(msg);
            // console.log('message type: ' + messageBody['type'])
            // console.log(messageBody);
            if (messageBody['type'] == 'recommendation_request') {
                handleInitialRecommendationRequest(messageBody)
            } else if (messageBody['type'] == 'search_item_query_hit') {
                handleQueryHit(messageBody);
            } else if (messageBody['type'] == 'search_item_response') {
                handleSearchItemResponse(messageBody);
            }
        })

        await node.start();

        await node.pubsub.subscribe('recommendation_query')
        await node.pubsub.subscribe(myPeerId)

    } catch (e) {
        console.log(e);
    }
}

async function main() {
    await startPeer();
}

main()
