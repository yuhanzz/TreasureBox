// const Libp2p = require('libp2p')
// const TCP = require('libp2p-tcp')
// const Mplex = require('libp2p-mplex')
// const { NOISE } = require('libp2p-noise')
// const Gossipsub = require('libp2p-gossipsub')
// const Bootstrap = require('libp2p-bootstrap')
// const PubsubPeerDiscovery = require('libp2p-pubsub-peer-discovery')
// const uint8ArrayFromString = require('uint8arrays/from-string')
// const uint8ArrayToString = require('uint8arrays/to-string')


// const config = require('./config.json');
// const bootstrapMultiaddrs = config['bootstrapMultiaddrs'];

const express = require('express');
const mongoose = require('mongoose');
const superagent = require('superagent');
// const path = require('path');

// // Global variables
// var node;
// var request_index = 0;
// var queryMap = new Map();
// var responseMap = new Map();
// var myPeerId;
// const p2pAddress = '/ip4/0.0.0.0/tcp/'
// var p2pPort = 15003

// // Helper functions
// function P2PmessageToObject(message) {
//   return JSON.parse(uint8ArrayToString(message.data))
// }

// function ObjectToP2Pmessage(message) {
//   return uint8ArrayFromString(JSON.stringify(message));
// }

// function handleGetItemRequest(messageBody) {
//   const queryId = messageBody['queryId'];
//   const content = messageBody['content'];
//   responseMap.set(queryId, content);

// }

function onConnectionSuccess() {
  console.log('item database connected')

  const initialItem = {
    category: "book",
    name: "The Sign of the Four",
    description: "Limited edition. Brand new status.",
    price: 17.8,
    seller: "0xE9ABC5FDb983f371fd76F20d40da7892b7f8b380"
  }

  superagent
    .post('http://localhost:8080/item')
    .send(initialItem)
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
    .then(onConnectionSuccess)
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

// async function startPeer() {

//   try {
//     node = await createNode(bootstrapMultiaddrs)
//     myPeerId = node.peerId.toB58String();

//     // peer discovery, for debugging
//     node.on('peer:discovery', (foundPeerId) => {
//       console.log(`Peer ${myPeerId} discovered: ${foundPeerId.toB58String()}`)
//     })

//     // listeners
//     node.pubsub.on('get-item-request', (msg) => {
//       console.log(P2PmessageToObject(msg));

//       const messageBody = P2PmessageToObject(msg);
//       handleGetItemRequest(messageBody);
//     })

//     await node.start();

//     await node.pubsub.subscribe('get-item-request')

//   } catch (e) {
//     console.log(e);
//   }
// }

async function main() {
  // startPeer();
  startServer();

  setTimeout(() => {
    superagent.get('http://localhost:8080/item')
      .query({ category: 'book' })
      .end((err, res) => {
        if (err) { return console.log(err); }
        console.log(res.body);
      });
  }, 30000);
}

main()