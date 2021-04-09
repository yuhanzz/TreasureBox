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

const createNode = async (bootstrapers) => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/15003']
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

async function main() {

  topic = 'hello'

  const node = await createNode(bootstrapMultiaddrs)

  node.on('peer:discovery', (peerId) => {
    console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
    node.dial(peerId)
  })

  node.pubsub.on(topic, (msg) => {
    console.log(`node ${node.peerId.toB58String()} received: ${uint8ArrayToString(msg.data)}`)
  })


  console.log(`peer node started with id: ${node.peerId.toB58String()}`)

  await node.start()

  await node.pubsub.subscribe(topic)

  setInterval(() => {
    node.pubsub.publish(topic, uint8ArrayFromString(`hello from ${node.peerId.toB58String()}`))
  }, 5000)

}

main()
