'use strict';

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;
var temperatureThreshold = 26;


Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
   // console.log('Error in function - 1 - JK ' + err.message);
    throw err;
  } else {
    //console.log('Error in function - JK -9 ' );
    client.on('error', function (err) {
      //console.log('Error in function - JK -9 ' + err.message );
      throw err;
      
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized - Jojo Koshy -v3');
        
        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          console.log('Client On function called - Jojo Koshy -v3');
          filterMessage(client, inputName, msg);
          });
        client.getTwin(function (err, twin) {
          if (err) {
                console.error('Error getting twin: ' + err.message);
          } else {
                twin.on('properties.desired', function(delta) {
                    if (delta.TemperatureThreshold) {
                        temperatureThreshold = delta.TemperatureThreshold;
                    }
                });
          }
        });
      }
    });
     

  }
});

 
// This function filters out messages that report temperatures below the temperature threshold.
// It also adds the MessageType property to the message with the value set to Alert.
function filterMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));
  //console.log('Inside filter method - Jojo Koshy -v3');
  if (inputName === 'input1') {
    console.log('Inside Input 1 condition filter method - Jojo Koshy -v3');
      var message = msg.getBytes().toString('utf8');
      var messageBody = JSON.parse(message);
      var messagedatabody = JSON.stringify(messageBody);
      console.log('Message received from tempSensor ' + messagedatabody);
      if (messageBody && messageBody.rhSensor && messageBody.rhSensor.temperature && messageBody.rhSensor.temperature > temperatureThreshold) {
          console.log(`Machine temperature ${messageBody.rhSensor.temperature} exceeds threshold ${temperatureThreshold}`);
          var outputMsg = new Message(message);
          outputMsg.properties.add('MessageType', 'Alert');
          console.log('Temperature exceeded - Jojo Koshy');
          client.sendOutputEvent('output1', outputMsg, printResultFor('Sending received message'));
      }
  }
}

// Helper function to print results in the console
function printResultFor(op) {
  return function printResult(err, res) {
    if (err) {
      console.log(op + ' error: ' + err.toString());
    }
    if (res) {
      console.log(op + ' status: ' + res.constructor.name);
    }
  };
}
