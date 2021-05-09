const express = require('express');
const mongoose = require('mongoose');

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
    .then(() => console.log('item database connected'))
    .catch(err => console.log(err));

  const Item = require('./models/Item');

  app.get('/item', (req, res) => {
    Item.find().then(items => res.send(items));
  });

  app.post('/item', (req, res) => {
    const newItem = new Item({
      name: req.body.name
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



startServer()