var mqtt = require('mqtt')
const publicIp = require('public-ip');
var client  = mqtt.connect('mqtt://0.0.0.0')



client.on('connect', function () {
  console.log('----listener connected-----')  
/*client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    }
  })*/
})


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
(async () => {
	console.log(await publicIp.v4());
	//=> '46.5.21.123'

	console.log(await publicIp.v6());
	//=> 'fe80::200:f8ff:fe21:67cf'
})();

postItem(1234, 'book', 'Jane Austen')
getItem('book')
getItem('book')
