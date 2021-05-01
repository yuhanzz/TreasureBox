var mqtt = require('mqtt')

function postItem(sellerId, category, detail) {
  const topic = category + '/' + sellerId
  const client = mqtt.connect("mqtt://broker:1883");
  client.publish(topic, detail, { retain: true })
}

function getItem(category) {
  const client = mqtt.connect("mqtt://broker:1883");
  client.on('connect', function () {
    console.log('connected');
    client.subscribe(category + '/#', function (err) {
      if (!err) {
        console.log("subscribed to " + category + '/#')
      } else {
        console.log(err)
      }
    })
  })
  client.on('message', function (topic, message) {
    if (message.toString().length > 0) {
      console.log('item get!')
      console.log(message.toString())
    }
    client.end()
  })
}

postItem(1234, 'book', 'Jane Austen')
getItem('book')
getItem('book')
