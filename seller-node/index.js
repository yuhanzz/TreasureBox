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
var responseMap = new Map();
var myPeerId;
const p2pAddress = '/ip4/0.0.0.0/tcp/'
var p2pPort = 15004

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

function startServer() {
  const app = express();
  const port = process.env.PORT || 8081;

  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));
  app.use(express.static(__dirname + '/public'));

  app.get('/', function (req, res) {
    res.render('index.html');
  });

  // Send search item query to other peers
  app.post('/sell', function (req, res) {
    var queryId = generateQueryId()

    var queryMessageBody = {
      from: myPeerId,
      queryId: queryId
    }

    var requestMessageBody = req.body;
    requestMessageBody['from'] = myPeerId;
    requestMessageBody['queryId'] = queryId;
    requestMessageBody['type'] = 'post_item_request';

    // Record the query in the queryMap
    queryMap.set(queryId, requestMessageBody);

    // Send p2p message
    node.pubsub.publish('post_item_query', ObjectToP2Pmessage(queryMessageBody));

    res.status(204).send();
  });


  app.listen(port);
  console.log('Server started at http://localhost:' + port);
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
    node.pubsub.on(myPeerId, (msg) => {
      console.log("message title: my peer id");
      const messageBody = P2PmessageToObject(msg);
      console.log(messageBody);
      if (messageBody['type'] == 'post_item_query_hit') {
        handleQueryHit(messageBody);
      }
    })

    await node.start();

    await node.pubsub.subscribe(myPeerId)

  } catch (e) {
    console.log(e);
  }
}

async function main() {
  startPeer();
  startServer();
}

main()



