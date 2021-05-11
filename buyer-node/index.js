// libp2p for p2p communication
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

// pubsub for recommendation
require('dotenv').config()
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub({ projectId: 'treasurebox-313320' });

// express for frontend communication
const express = require('express');
var cors = require('cors');
const path = require('path');

// Global variables
var node;
var request_index = 0;
var queryMap = new Map();
var responseMap = new Map();
var myPeerId;
const p2pAddress = '/ip4/0.0.0.0/tcp/'
var p2pPort = 15003

var userInfo = {
  longitude: 0,
  latitude: 0,
  userId: 'default@gmail.com',
  myPeerId: null
}

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

async function createGeolocationResource(userId) {

  try {
    await pubSubClient.topic(userId).iam.getPolicy();
  } catch (e) {
    await pubSubClient.createTopic(userId);
  }
  try {
    await pubSubClient.subscription(userId).getMetadata();
  } catch (e) {
    await pubSubClient.topic(userId).createSubscription(userId);
  }
}

async function updateGeolocation(topicName, content) {
  const topic = pubSubClient.topic(topicName);
  await topic.get({ autoCreate: true }, async (err, t) => {
    const messageId = await topic.publish(Buffer.from(content));
  })
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

function handleInitialRecommendationResponse(messageBody) {
  updateGeolocation(userInfo['userId'], JSON.stringify(userInfo));
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

async function startServer() {
  const app = express();
  const port = process.env.PORT || 8080;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  // Send search item query to other peers
  app.get('/search', async function (req, res) {
    var queryMessageBody = req.query;
    var queryId = generateQueryId();
    queryMessageBody['from'] = myPeerId;
    queryMessageBody['queryId'] = queryId;

    var requestMessageBody = queryMessageBody;
    requestMessageBody['type'] = 'search_item_request';

    // Record the query in the queryMap
    queryMap.set(queryId, requestMessageBody);

    // Send p2p message
    node.pubsub.publish('search_item_query', ObjectToP2Pmessage(queryMessageBody));

    // Wait for response
    var itemList;
    await ensureResponseArrives(queryId, 1000000).then(function () {
      itemList = responseMap.get(queryId);
      responseMap.delete(queryId);
    });
    res.status(200).send(itemList);
  });

  app.post('/init-recommendation', async function (req, res) {
    await createGeolocationResource(req.body['userId']);
    userInfo['userId'] = req.body['userId'];
    var queryMessageBody = {
      userId: userInfo['userId']
    };
    var queryId = generateQueryId();
    queryMessageBody['from'] = myPeerId;
    queryMessageBody['queryId'] = queryId;

    var requestMessageBody = queryMessageBody;
    requestMessageBody['type'] = 'recommendation_request';

    // Record the query in the queryMap
    queryMap.set(queryId, requestMessageBody);

    // Send p2p message
    node.pubsub.publish('recommendation_query', ObjectToP2Pmessage(queryMessageBody));

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
    userInfo['myPeerId'] = myPeerId

    // peer discovery, for debugging
    node.on('peer:discovery', (foundPeerId) => {
      console.log(`Peer ${myPeerId} discovered: ${foundPeerId.toB58String()}`)
    })

    // listeners
    node.pubsub.on(myPeerId, (msg) => {
      console.log(P2PmessageToObject(msg));

      const messageBody = P2PmessageToObject(msg);
      if (messageBody['type'] == 'search_item_query_hit' || messageBody['type'] == 'recommendation_query_hit') {
        handleQueryHit(messageBody);
      } else if (messageBody['type'] == 'search_item_response') {
        handleSearchItemResponse(messageBody);
      } else if (messageBody['type'] == 'initial_recommendation_response') {
        handleInitialRecommendationResponse(messageBody);
      }
    })

    await node.start();

    await node.pubsub.subscribe(myPeerId)

  } catch (e) {
    console.log(e);
  }
}

async function main() {
  await startPeer();
  await startServer();
}

main()



