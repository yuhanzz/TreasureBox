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
  const senderPeerId = messageBody['from']
  delete messageBody['from']

  superagent.get('http://localhost:8080/item')
    .query(messageBody)
    .end((err, res) => {
      if (err) { return console.log(err); }
      const items = res.body
      console.log("item fetched: \n" + items)
      node.pubsub.publish(senderPeerId, ObjectToP2Pmessage(items));
    });
}

function handlePostItemRequest(messageBody) {
  const newItem = {
    category: messageBody['category'],
    name: messageBody['name'],
    description: messageBody['description'],
    price: messageBody['price'],
    seller: messageBody['seller']
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
    console.log(req.query)
    Item.find(req.query).then(items => res.send(items));
  });

  app.post('/item', (req, res) => {
    const newItem = new Item({
      category: req.body.category,
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      seller: req.body.seller
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
      console.log(P2PmessageToObject(msg));
      const queryMessageBody = P2PmessageToObject(msg);
      const responseMessageBody = {
        type: 'post_item_query_hit',
        queryId: queryMessageBody['queryId'],
        from: myPeerId
      }
      node.pubsub.publish(queryMessageBody['from'], ObjectToP2Pmessage(responseMessageBody))
    })

    // node.pubsub.on('get_item_request', (msg) => {
    //   console.log(P2PmessageToObject(msg));

    //   const messageBody = P2PmessageToObject(msg);
    //   handleGetItemRequest(messageBody);
    // })

    node.pubsub.on(myPeerId, (msg) => {
      console.log(P2PmessageToObject(msg));

      const messageBody = P2PmessageToObject(msg);
      if (messageBody['type'] == 'post_item_request') {
        handlePostItemRequest(messageBody);
      }
    })

    await node.start();

    await node.pubsub.subscribe('post_item_query')
    // await node.pubsub.subscribe('get_item_request')
    await node.pubsub.subscribe('post_item_request')
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