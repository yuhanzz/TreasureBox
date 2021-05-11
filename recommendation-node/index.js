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

// pubsub
require('dotenv').config()
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub({ projectId: 'treasurebox-313320' });

// Global variables
var node;
var myPeerId;
const p2pAddress = '/ip4/0.0.0.0/tcp/'
var p2pPort = 15005

// Helper functions
function P2PmessageToObject(message) {
    return JSON.parse(uint8ArrayToString(message.data))
}

function ObjectToP2Pmessage(message) {
    return uint8ArrayFromString(JSON.stringify(message));
}

async function addNewUser(userId) {

    const topic = pubSubClient.topic(userId);
    const subscription = topic.subscription(userId);

    try {
        await subscription.get({ autoCreate: true }, async (err, t) => {
            subscription.on('message', message => {
                console.log('Received message:', message.data.toString());
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
            console.log('message title: my peer id')
            const messageBody = P2PmessageToObject(msg);
            console.log('message type: ' + messageBody['type'])
            console.log(messageBody);
            if (messageBody['type'] == 'recommendation_request') {
                handleInitialRecommendationRequest(messageBody)
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