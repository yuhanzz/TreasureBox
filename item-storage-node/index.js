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
const mongoose = require('mongoose');
const superagent = require('superagent');

const geolib = require('geolib');

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

function handleGetItemRequest(messageBody) {

  const queryId = messageBody['queryId']
  const requestorPeerId = messageBody['from']

  // firstly sends query hit message
  const queryHitResponseMessageBody = {
    type: 'get_item_query_hit',
    queryId: queryId,
    from: myPeerId
  }
  node.pubsub.publish(requestorPeerId, ObjectToP2Pmessage(queryHitResponseMessageBody))

  // perform database operation and send data
  delete messageBody['from']
  delete messageBody['queryId']
  delete messageBody['type']

  superagent.get('http://localhost:8080/item')
    .query(messageBody)
    .end((err, res) => {
      if (err) { return console.log(err); }
      const itemsResponse = {
        type: 'get_item_response',
        queryId: queryId,
        from: myPeerId,
        data: res.body
      }
      node.pubsub.publish(requestorPeerId, ObjectToP2Pmessage(itemsResponse));
    });
}

function handlePostItemRequest(messageBody) {
  const newItem = {
    category: messageBody['category'],
    name: messageBody['name'],
    description: messageBody['description'],
    price: messageBody['price'],
    seller: messageBody['seller'],
    longitude: messageBody['longitude'],
    latitude: messageBody['latitude']
  }

  superagent
    .post('http://localhost:8080/item')
    .send(newItem)
    .end((err, res) => {
    });
}

function startServer() {

  const app = express();
  const port = process.env.PORT || 8080;

  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  mongoose
    .connect(
      'mongodb://mongo:27017/item-db',
      { useNewUrlParser: true }
    )
    .then(() => { console.log('item database connected') })
    .catch(err => console.log(err));

  const Item = require('./models/Item');

  app.get('/item', (req, res) => {
    if ('longitude' in req.query && 'latitude' in req.query) {
      const currentLongitude = req.query['longitude']
      const currentLatitude = req.query['latitude']
      Item.find().then(items => {
	console.log('current longitude:' + currentLongitude)
	console.log('current latitude:' + currentLatitude)
	console.log('-----all items-----')
	console.log(items)
        const filtered_items = items.filter(item =>
          geolib.isPointWithinRadius(
            { latitude: currentLatitude, longitude: currentLongitude },
            { latitude: item.latitude, longitude: item.longitude },
            // within 20 km 
            20000
          )
        );
	console.log('-----filtered items-----')
	console.log(filtered_items)
        res.send(filtered_items);
      })
    } else {
      Item.find(req.query).then(items => res.send(items));
    }
  });

  app.post('/item', (req, res) => {
    const newItem = new Item({
      category: req.body.category,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      seller: req.body.seller,
      longitude: req.body.longitude,
      latitude: req.body.latitude
    });
    newItem.save().then(item => res.status(204).json(item));
  });

  app.delete('/item', (req, res) => {
    const nameToDelete = req.body.name
    Item.deleteMany({ name: nameToDelete }, function (err) { })
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
    node.pubsub.on('post_item_query', (msg) => {
      console.log('message title: post_item_query')
      const queryMessageBody = P2PmessageToObject(msg);
      console.log(queryMessageBody);
      const responseMessageBody = {
        type: 'post_item_query_hit',
        queryId: queryMessageBody['queryId'],
        from: myPeerId
      }
      node.pubsub.publish(queryMessageBody['from'], ObjectToP2Pmessage(responseMessageBody))
    })

    node.pubsub.on('get_item_query', (msg) => {
      console.log('message title: get_item_query')
      const messageBody = P2PmessageToObject(msg);
      console.log(messageBody);
      handleGetItemRequest(messageBody);
    })

    node.pubsub.on(myPeerId, (msg) => {
      console.log('message title: my peer id')
      const messageBody = P2PmessageToObject(msg);
      console.log('message type: ' + messageBody['type'])
      console.log(messageBody);
      if (messageBody['type'] == 'post_item_request') {
        handlePostItemRequest(messageBody);
      }
    })

    await node.start();

    await node.pubsub.subscribe('post_item_query')
    await node.pubsub.subscribe('get_item_query')
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
