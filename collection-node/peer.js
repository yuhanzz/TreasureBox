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

// Helper functions
function P2PmessageToObject(message) {
  return JSON.parse(uint8ArrayToString(message.data))
}

function ObjectToP2Pmessage(message) {
  return uint8ArrayFromString(JSON.stringify(message));
}

function handleSearchItem(messageBody) {
  const requestorPeerId = messageBody['from'];
  var responseMessageBody = {
    type: "search_item_response",
    content: "request is successful",
    from: myPeerId,
    queryId: messageBody['queryId']
  }
  node.pubsub.publish(requestorPeerId, ObjectToP2Pmessage(responseMessageBody));
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
      node.dial(foundPeerId)
    })

    // listeners
    node.pubsub.on('search_item_query', (msg) => {
      console.log(P2PmessageToObject(msg));
      const queryMessageBody = P2PmessageToObject(msg);
      const responseMessageBody = {
        type: 'search_item_query_hit',
        queryId: queryMessageBody['queryId'],
        from: myPeerId
      }

      node.pubsub.publish(queryMessageBody['from'], ObjectToP2Pmessage(responseMessageBody))
    })

    node.pubsub.on(myPeerId, (msg) => {
      console.log(P2PmessageToObject(msg));

      const messageBody = P2PmessageToObject(msg);
      if (messageBody['type'] == 'search_item_request') {
        handleSearchItem(messageBody);
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
  // Specify port for p2p
  p2pPort = process.argv[2];
  startPeer();
}

main()