// const createRelayServer = require('libp2p-relay-server')

//     ; (async () => {
//         const relay = await createRelayServer({
//             listenAddresses: ['/ip4/0.0.0.0/tcp/0']
//         })
//         console.log(`libp2p relay starting with id: ${relay.peerId.toB58String()}`)
//         await relay.start()
//         const relayMultiaddrs = relay.multiaddrs.map((m) => `${m.toString()}/p2p/${relay.peerId.toB58String()}`)
//     })()



//     const createRelayServer = require('libp2p-relay-server')
// const PeerId = require('peer-id')

// async function main () {
//   const peerIdJson = require('./id.json')
//   const peerId = await PeerId.createFromJSON(peerIdJson)

//   const relay = await createRelayServer({
//     listenAddresses: ['/ip4/0.0.0.0/tcp/15003'],
//     peerId
//   })

//   await relay.start()
//   console.log(`libp2p relay started with id: ${relay.peerId.toB58String()}`)

//   const relayMultiaddrs = relay.multiaddrs.map((m) => `${m.toString()}/p2p/${relay.peerId.toB58String()}`)

//   console.log('listening on', relayMultiaddrs)
// }

// main()


const createRelayServer = require('libp2p-relay-server')

async function main() {

    const relay = await createRelayServer({
        listenAddresses: ['/ip4/0.0.0.0/tcp/15003'],
    })

    await relay.start()
    console.log(`libp2p relay started with id: ${relay.peerId.toB58String()}`)

    const relayMultiaddrs = relay.multiaddrs.map((m) => `${m.toString()}/p2p/${relay.peerId.toB58String()}`)

    console.log('listening on', relayMultiaddrs)
}

main()
