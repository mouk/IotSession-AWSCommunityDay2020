const AWS = require('aws-sdk')

AWS.config.region = 'eu-west-1'

const MQTT_BROKER_ENDPOINT = 'XXXXXXX-ats.iot.eu-west-1.amazonaws.com';
const THING_NAME = "mySensor";


const iotdata = new AWS.IotData({
    endpoint: MQTT_BROKER_ENDPOINT
})

exports.handler = async function (request) {
  log("DEBUG:", "Request", JSON.stringify(request));
  if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
    return handleDiscovery(request);
  }
  else if (request.directive.header.namespace === 'Alexa') {
    if (request.directive.header.name === 'ReportState') {
      return await handleReportState(request);
    }
  }

  function handleDiscovery(request) {
    var payload = {
      endpoints: [
        {
          endpointId: "MOUK_THRMOSTAT",
          manufacturerName: "Mouk inc.",
          description: "Smart Thermostat by Thermostat Maker",
          friendlyName: "Kitchen Thermostat",
          displayCategories: ["TEMPERATURE_SENSOR"],
          cookie: {},
          capabilities: [
            {
              type: "AlexaInterface",
              "interface": "Alexa.TemperatureSensor",
              version: "3",
              properties: {
                supported: [
                  {
                    name: "temperature"
                  }
                ],
                proactivelyReported: true,
                retrievable: true
              }
            },
            {
              type: "AlexaInterface",
              "interface": "Alexa",
              version: "3"
            }
          ]
        }
      ]
    }
    var header = request.directive.header;
    header.name = "Discover.Response";
    log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
   return { event: { header: header, payload: payload } };
  }

  function log(message, message1, message2) {
    console.log(message + message1 + message2);
  }
  
  function readThingShadow() {
    return new Promise((resolve, reject) => {

        var params = {
            thingName: THING_NAME
        }

        iotdata.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack)
                reject(`Failed to read thing shadow: ${err.errorMessage}`)
            } else {
                resolve(JSON.parse(data.payload));
            }
        })
    })
}


  async function handleReportState(request, context) {
    var responseHeader = request.directive.header;
    responseHeader.namespace = "Alexa";
    responseHeader.name = "StateReport";
    responseHeader.messageId = responseHeader.messageId + "-R";
    // get user token pass in request
    var requestToken = request.directive.endpoint.scope.token;
    
    const ts = await readThingShadow();
    const temp = ts.state.reported.temperature;
    
    var contextResult = {
      "properties": [
        {
          "namespace": "Alexa.TemperatureSensor",
          "name": "temperature",
          "value": {
            "value": temp,
            "scale": "CELSIUS"
          },
          "timeOfSample": new Date().toJSON(),
          "uncertaintyInMilliseconds": 1000
        }
      ]
    };
    var response = {
      context: contextResult,
      event: {
        header: responseHeader,
        endpoint: {
          scope: {
            type: "BearerToken",
            token: requestToken
          },
          endpointId: "demo_id"
        },
        payload: {}
      }
    };
    return response;
  }
}