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
