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

const express = require('express');
const path = require('path');

// Global variables
var node;
var request_index = 0;
var queryMap = new Map();

// Helper functions

// query ID is peerId + timestamp + request_index, example: QmPtbwUx8wLRwzZyFtWjTJvJCCv1ZonHcUdj1uTv373aKc-1619730560381-0
function generateQueryId() {
  const current_index = request_index;

  // update request_index
  if (request_index == Number.MAX_SAFE_INTEGER) {
    request_index = 0;
  } else {
    request_index++;
  }

  return node.peerId.toB58String() + `-` + (new Date()).getTime() + `-` + current_index;
}

function handleQueryHit(messageBody) {
  const messageQueryId = messageBody['queryId'];

  if (queryMap.has(messageQueryId)) {
    const providerPeerId = messageBody['peerId'];
    const requestMessageBody = queryMap.get(messageQueryId);
    node.pubsub.publish(providerPeerId, uint8ArrayFromString(JSON.stringify(requestMessageBody)));
    queryMap.delete(messageQueryId);
  }
  
}

function startServer() {
  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/public/index.html'));
  });

  // Send search item query to other peers
  app.post('/search', function (req, res) {
    var queryMessageBody = req.body;
    var queryId = generateQueryId();
    queryMessageBody['peerId'] = node.peerId.toB58String();
    queryMessageBody['queryId'] = queryId;

    var requestMessageBody = {
      type: 'search_item_request',
      searchCategory: queryMessageBody.searchCategory,
      peerId: node.peerId.toB58String()
    };

    // Record the query in the queryMap
    queryMap.set(queryId, requestMessageBody);


    console.log(queryId);
    console.log(queryMessageBody);
    console.log(queryMap.get(queryId));


    // Send p2p message
    node.pubsub.publish('search_item_query', uint8ArrayFromString(JSON.stringify(queryMessageBody)))

    res.status(204).send();
    // node.pubsub.publish(`search_item_query`, uint8ArrayFromString(`hello from ${node.peerId.toB58String()}`))
  });


  app.listen(port);
  console.log('Server started at http://localhost:' + port);
}

const createNode = async (bootstrapers) => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/13003']
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

    // peer discovery, for debugging
    node.on('peer:discovery', (peerId) => {
      console.log(`Peer ${node.peerId.toB58String()} discovered: ${peerId.toB58String()}`)
      node.dial(peerId)
    })

    // handler
    node.pubsub.on(node.peerId.toB58String(), (msg) => {
      console.log(msg);
      const messageBody = JSON.parse(uint8ArrayToString(msg.data));
      if (messageBody['type'] == 'search_item_query_hit') {
        handleQueryHit(messageBody);
      }
    })

    // start the node
    console.log(`peer node started with id: ${node.peerId.toB58String()}`)

    await node.start();

    // buyer node only handles messages whose title is the buyer node's peer ID
    await node.pubsub.subscribe(node.peerId.toB58String())

  } catch (e) {
    console.log(e);
  }
}

async function main() {
  startPeer();
  startServer();
}

main()



