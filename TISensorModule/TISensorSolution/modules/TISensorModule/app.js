'use strict';

var Transport = require('azure-iot-device-mqtt').Mqtt;
var Client = require('azure-iot-device').ModuleClient;
var Message = require('azure-iot-device').Message;
var temperatureThreshold = 26;
var SensorTag = require('sensortag');					// sensortag library
var tags = new Array;	
var tagRecord = {};			// make an object to hold sensor values
var tagclient;
function handleTag(tag) {
	console.log('new tag connected');
	
	tags.push(tagRecord);	// add it to the tags array

	function disconnect() {
		console.log('tag disconnected!');
	}
	/*
	This function enables and configures the sensors, and
	sets up their notification listeners. Although it only shows
	simple key data here, you could duplicate this pattern
	with any of the sensors.
	*/
	function enableSensors() {		// attempt to enable the sensors
		console.log('enabling sensors');
		// // enable sensor:
		tag.enableAccelerometer();
		tag.enableBarometricPressure();	 
    tag.enableHumidity();
    
    tagRecord.timestamp = {timestamp: 'current time'};
    
		// make an object to hold each sensor's values:
		tagRecord.accel = {sensor: 'accelerometer'};
 		tagRecord.barometer = {sensor: 'barometric pressure'};

		tagRecord.rhSensor = {sensor: 'humidity'};
		tag.setHumidityPeriod(5000);
		// then turn on notifications:
		tag.notifyHumidity();	 

		// then turn on notifications:
		tag.notifySimpleKey();
    console.log('enabled sensors - JK');
    // set a 5-second read sensors interval:
   // setInterval( function() { readSensors(client); }, 7000 );
		setInterval(readSensors, 7000);
	}

	// read all the sensors except the keys:
	function readSensors() {
	 
		tag.readAccelerometer(reportAccelerometer);
		tag.readBarometricPressure(reportBarometricPressure);
		tag.readHumidity(reportHumidity);
    
    var data = JSON.stringify(tagRecord);
    console.log('JK tag record ' + JSON.stringify(tagRecord) );
    var message = new Message(data);
    //     console.log('Sending message: ' + message.getData());
    
    //     //Changing the Output to name it to temperatureOutput
    tagclient.sendOutputEvent('temperatureOutput', message, printResultForNew('sendOutputEvent - tag'));
    console.log('tag client called ');
  }
  
  function printResultForNew(op) {
    return function printResult(err, res) {
      if (err) {
        console.log(op + ' error: ' + err.toString());
      }
      if (res) {
        console.log(op + ' status: ' + res.constructor.name);
      }
    };
  }

	function reportAccelerometer (x, y, z) {
		// read the three values and save them in the
    // sensor value object:
    var timeStampvalue = Math.floor(Date.now() / 1000);
    tagRecord.timestamp.id = timeStampvalue;
    var dt = new Date();
    //dt += (8 * 60 * 60 * 1000);
    var utcDate = dt.toUTCString();
   
    tagRecord.timestamp.utctime =  utcDate;
    


		tagRecord.accel.x = x;
		tagRecord.accel.y = y;
		tagRecord.accel.z = z;
		console.log(tagRecord.accel); // print it
		console.log();
	}

	function reportBarometricPressure(pressure) {
		// read the three values and save them in the
		// sensor value object:
		tagRecord.barometer.pressure = pressure;
		console.log(tagRecord.barometer); // print it
		console.log();
	}


	function reportHumidity(temperature, humidity) {
		// read the three values and save them in the
		// sensor value object:
		tagRecord.rhSensor.temperature = temperature;
		tagRecord.rhSensor.humidity = humidity;
		console.log(tagRecord.rhSensor); // print it
		console.log();

		//console.log('JK values - ' + JSON.stringify(tagRecord) );
	}

	
 
 

	// Now that you've defined all the functions, start the process.
	// connect to the tag and set it up:
	tag.connectAndSetUp(enableSensors);
	// set a listener for when the keys change:

	tag.on('humidityChange', reportHumidity);
	// set a listener for the tag disconnects:
	tag.on('disconnect', disconnect);
}

// listen for tags and handle them when you discover one:

Client.fromEnvironment(Transport, function (err, client) {
  if (err) {
    console.log('Error in function - 30 - JK ' + err.message);
    throw err;
  } else {
    console.log('Error in function - JK -30' );
    client.on('error', function (err) {
      console.log('Error in function - JK -30 ' + err.message );
      throw err;
      
    });

    // connect to the Edge instance
    client.open(function (err) {
      if (err) {
        throw err;
      } else {
        console.log('IoT Hub module client initialized - Jojo Koshy -30');
        
        // Act on input messages to the module.
        client.on('inputMessage', function (inputName, msg) {
          console.log('Client On function called - Jojo Koshy - 30');
        //    filterMessage(client, inputName, msg);
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
    tagclient = client;
    SensorTag.discoverAll(handleTag);
    
    // // Create a message and send it every two seconds
    // setInterval(function () {
    //     var temperature = 20 + (Math.random() * 10); // range: [20, 30]
    //     var temperatureAlert = (temperature > 28) ? 'true' : 'false';
    //     var data = JSON.stringify({ deviceId: 'myFirstDevice', temperature: temperature, temperatureAlert: temperatureAlert });
    //     var message = new Message(data);
    //     console.log('Sending new message: ' + message.getData());
  
    //     //Changing the Output to name it to temperatureOutput
    //     client.sendOutputEvent('temperatureOutput', message, printResultFor('sendOutputEvent'));
    //   }, 4000);
  }
});

 
// This function filters out messages that report temperatures below the temperature threshold.
// It also adds the MessageType property to the message with the value set to Alert.
function filterMessage(client, inputName, msg) {
  client.complete(msg, printResultFor('Receiving message'));
  console.log('Inside filter method - Jojo Koshy -v3');
  if (inputName === 'input1') {
    console.log('Inside Input 1 condition filter method - Jojo Koshy -v3');
      var message = msg.getBytes().toString('utf8');
      var messageBody = JSON.parse(message);
      if (messageBody && messageBody.machine && messageBody.machine.temperature && messageBody.machine.temperature > temperatureThreshold) {
          console.log(`Machine temperature ${messageBody.machine.temperature} exceeds threshold ${temperatureThreshold}`);
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
