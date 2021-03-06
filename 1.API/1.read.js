
exports.handler = async (event) => {
    const ts = await readThingShadow();
    return {
        statusCode: 200,
        "Content-Type": "application/json",
        body: JSON.stringify(ts.state.reported),
    };
};


const THING_NAME = "mySensor";
const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'
const iotdata = new AWS.IotData({
    endpoint: 'XXXXXX-ats.iot.eu-west-1.amazonaws.com'
})



function readThingShadow() {
    return new Promise((resolve, reject) => {

        var params = {
            thingName: THING_NAME
        }

        iotdata.getThingShadow(params, (err, data) => {
            if (err) {
                console.log(err, err.stack)
                reject(`Failed to update thing shadow: ${err.errorMessage}`)
            } else {
                
                const ts = JSON.parse(data.payload)
                console.log(JSON.stringify(ts,null,'\t'))
                resolve(ts)
            }
        })
    })
}