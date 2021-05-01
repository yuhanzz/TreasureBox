console.log("-----mqtt client trying to start-----")

var mqtt = require('mqtt')
// var client = mqtt.connect({ port: 1883, host: '127.0.0.1', keepalive: 10000});
// var client = mqtt.connect([{ host: 'localhost', port: 1883 }]);
const client = mqtt.connect("mqtt://broker:1883");

client.on('error', function(error) {
    console.log(error);
})

client.on('connect', function () {
console.log('trying to connect');
  client.subscribe('presence', function (err) {
    if (!err) {
      client.publish('presence', 'Hello mqtt')
    } else {
        console.log('connection failed!!')
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString())
  client.end()
})


// var mqtt = require('mqtt')
// var client  = mqtt.connect('0.0.0.0:1883')

// var host = '0.0.0.0';     // change!
// var port = 1883;    // change according to protocol
// var clientId = 'clientjs';  // change!
// var topic = 'testtopic/geolocation';  // change!

// var dataSender;
// var coords;

// function sendLocation() {
//     if (!navigator.geolocation) {
//         status.textContent = 'geo location is not supported';
//     } else {
//         navigator.geolocation.getCurrentPosition(
//             function (pos) {
//                 // TODO: Here we can compare the new coords and old coords and only send data if the coords changed a lot (Or maybe use the watchPosition function)
//                 coords = pos.coords;
//                 message = new Paho.MQTT.Message('(' + coords.latitude + ',' + coords.longitude + ')');
//                 message.destinationName = topic;
//                 mqtt.send(message);
//                 console.log('(' + coords.latitude + ',' + coords.longitude + ')');
//             },
//             function (err) {
//                 console.warn(`ERROR(${err.code}): ${err.message}`);
//                 alert('failed to share location data');
//                 clearInterval(dataSender);
//             }
//         );
//     }
// }

// function mqttConnect() {
//     console.log("connecting to " + host + " " + port);
//     mqtt = new Paho.MQTT.Client(host, port, clientId);
//     var options = {
//         timeout: 2000,
//         onSuccess: function () {
//             console.log("MQTT Connected");
//         }
//     };
//     mqtt.connect(options);
// }

// mqttConnect();

// document.addEventListener('DOMContentLoaded', function () {

//     mqttConnect();

//     var checkbox = document.querySelector('#geoSwitch');

//     checkbox.addEventListener('change', function () {
//         if (checkbox.checked) {
//             console.log('geo location enabled');
//             dataSender = setInterval(sendLocation, 5000);
//         } else {
//             console.log('geo location disabled');
//             clearInterval(dataSender);
//         }
//     });
// });


