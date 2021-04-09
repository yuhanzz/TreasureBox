var mqtt;
var host = 'broker.hivemq.com';     // change!
var port = 8000;    // change according to protocol
var clientId = 'clientjs';  // change!
var topic = 'testtopic/geolocation';  // change!

var dataSender;
var coords;

function sendLocation() {
    if (!navigator.geolocation) {
        status.textContent = 'geo location is not supported';
    } else {
        navigator.geolocation.getCurrentPosition(
            function (pos) {
                // TODO: Here we can compare the new coords and old coords and only send data if the coords changed a lot (Or maybe use the watchPosition function)
                coords = pos.coords;
                message = new Paho.MQTT.Message('(' + coords.latitude + ',' + coords.longitude + ')');
                message.destinationName = topic;
                mqtt.send(message);
                console.log('(' + coords.latitude + ',' + coords.longitude + ')');
            },
            function (err) {
                console.warn(`ERROR(${err.code}): ${err.message}`);
                alert('failed to share location data');
                clearInterval(dataSender);
            }
        );
    }
}

function mqttConnect() {
    console.log("connecting to " + host + " " + port);
    mqtt = new Paho.MQTT.Client(host, port, clientId);
    var options = {
        timeout: 2000,
        onSuccess: function () {
            console.log("MQTT Connected");
        }
    };
    mqtt.connect(options);
}

document.addEventListener('DOMContentLoaded', function () {

    mqttConnect();

    var checkbox = document.querySelector('#geoSwitch');

    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            console.log('geo location enabled');
            dataSender = setInterval(sendLocation, 5000);
        } else {
            console.log('geo location disabled');
            clearInterval(dataSender);
        }
    });
});


