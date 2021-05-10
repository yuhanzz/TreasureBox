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

// Global variables
var node;
var myPeerId;
const p2pAddress = '/ip4/0.0.0.0/tcp/'
var p2pPort = 15003
var aliveStorageNodes = new Map();

// Helper functions
function P2PmessageToObject(message) {
  return JSON.parse(uint8ArrayToString(message.data))
}

function ObjectToP2Pmessage(message) {
  return uint8ArrayFromString(JSON.stringify(message));
}

function handleGetItemQueryHit(messageBody) {
  const queryId = messageBody['queryId']
  const fromPeerId = messageBody['from']
  if (aliveStorageNodes.has(queryId)) {
    // for all the item storage nodes who responded query hit in time, we set an entry in Map to wait for following response
    aliveStorageNodes.get(queryId).set(fromPeerId, null)
  }
}

function handleGetItemResponse(messageBody) {
  const queryId = messageBody['queryId']
  const fromPeerId = messageBody['from']
  const data = messageBody['data']
  if (aliveStorageNodes.has(queryId) && aliveStorageNodes.get(queryId).has(fromPeerId)) {
    aliveStorageNodes.get(queryId).set(fromPeerId, data)
  }
}

function handleSearchItemRequest(messageBody) {
  const queryId = messageBody['queryId']
  const requestorPeerId = messageBody['from']
  aliveStorageNodes.set(queryId, new Map())

  // send messages to all the item-storage nodes
  messageBody['from'] = myPeerId
  messageBody['type'] = 'get_item_request'
  node.pubsub.publish('get_item_query', ObjectToP2Pmessage(messageBody));

  // wait 500 millionseconds for query hits
  setTimeout(() => {
    // wait for slow nodes
    ensureItemsArrives(queryId, 1000000).then(function () {
      // combine all the data
      var allItems = []
      for (let itemList of aliveStorageNodes.get(queryId).values()) {
        allItems = allItems.concat(itemList)
      }
      // send back response
      var responseMessageBody = {
        type: "search_item_response",
        from: myPeerId,
        queryId: queryId,
        data: allItems
      }
      node.pubsub.publish(requestorPeerId, ObjectToP2Pmessage(responseMessageBody));
    });
  }, 500)
}

function isAllArive(queryId) {
  var arrived = true
  var responses = aliveStorageNodes.get(queryId)
  for (let value of responses.values()) {
    if (value == null) {
      arrived = false;
    }
  }
  return arrived
}

// wait for the response of all the item-storage-node alive. 
function ensureItemsArrives(queryId, timeout) {
  var start = Date.now();
  return new Promise(waitForResponse);

  function waitForResponse(resolve, reject) {
    if (isAllArive(queryId))
      resolve(aliveStorageNodes.get(queryId));
    else if (timeout && (Date.now() - start) >= timeout)
      reject(new Error("timeout"));
    else
      setTimeout(waitForResponse.bind(this, resolve, reject), 30);
  }
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
    node = await createNode(bootstrapMultiaddrs);
    myPeerId = node.peerId.toB58String();

    node.on('peer:discovery', (foundPeerId) => {
      console.log(`Peer ${myPeerId} discovered: ${foundPeerId.toB58String()}`)
    })

    // listeners
    node.pubsub.on('search_item_query', (msg) => {
      console.log('message title: search_item_query')
      const queryMessageBody = P2PmessageToObject(msg);
      console.log(queryMessageBody);
      const responseMessageBody = {
        type: 'search_item_query_hit',
        queryId: queryMessageBody['queryId'],
        from: myPeerId
      }

      node.pubsub.publish(queryMessageBody['from'], ObjectToP2Pmessage(responseMessageBody))
    })

    node.pubsub.on(myPeerId, (msg) => {
      console.log('message title: my peer id')
      const messageBody = P2PmessageToObject(msg);
      console.log('message type: ' + messageBody['type'])
      console.log(messageBody)

      if (messageBody['type'] == 'search_item_request') {
        handleSearchItemRequest(messageBody);
      } else if (messageBody['type'] == 'get_item_query_hit') {
        handleGetItemQueryHit(messageBody);
      } else if (messageBody['type'] == 'get_item_response') {
        handleGetItemResponse(messageBody);
      }
    })

    await node.start()

    await node.pubsub.subscribe('search_item_query')
    await node.pubsub.subscribe(myPeerId)

  } catch (e) {
    console.log(e);
  }
}

async function main() {
  startPeer();
}

main()
