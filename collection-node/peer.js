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

const createNode = async (bootstrapers) => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/14003']
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
    const node = await createNode(bootstrapMultiaddrs)

    node.on('peer:discovery', (peerId) => {
      console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
      node.dial(peerId)
    })

    // handlers
    node.pubsub.on('search_item_query', (msg) => {
      // var messageStr = uint8ArrayToString(msg.data);
      const queryMessageBody = JSON.parse(uint8ArrayToString(msg.data));
      const responseMessageBody = {
        type: 'search_item_query_hit',
        queryId: queryMessageBody['queryId'],
        peerId: node.peerId.toB58String()
      }

      console.log(queryMessageBody['peerId']);
      console.log(responseMessageBody);
      node.pubsub.publish(queryMessageBody['peerId'], uint8ArrayFromString(JSON.stringify(responseMessageBody)))
      // node.pubsub.publish('search_item_query_hit', uint8ArrayFromString(`hello from ${node.peerId.toB58String()}`))
      // console.log(`node ${node.peerId.toB58String()} received: ${uint8ArrayToString(msg.data)}`)
    })

    node.pubsub.on(node.peerId.toB58String(), (msg) => {
      console.log(JSON.parse(uint8ArrayToString(msg.data)));
      // console.log(`node ${node.peerId.toB58String()} received: ${uint8ArrayToString(msg.data)}`)
    })


    console.log(`peer node started with id: ${node.peerId.toB58String()}`)

    await node.start()

    await node.pubsub.subscribe('search_item_query')
    await node.pubsub.subscribe(node.peerId.toB58String())

    // setInterval(() => {
    //   node.pubsub.publish(topic, uint8ArrayFromString(`hello from ${node.peerId.toB58String()}`))
    // }, 5000)
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  startPeer();
}

main()