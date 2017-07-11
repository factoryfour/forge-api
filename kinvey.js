const kinveyConfig = require('./config/kinvey_config.js');
console.log(kinveyConfig);
const datastore = require('@fusiform/kinvey')(kinveyConfig).dataStore;
const kinvey = require('kinvey-node-sdk');


const query = new kinvey.Query();
query.notEqualTo('userId', '');

datastore.query('configurations', query)
    .then((results) => {   
        results.forEach((result, index) => {
            if (!/^[A-Z]{4}$/.test(result.frameId)) {
                console.log(`Incorrectly formatted frame Id for userId: ${result.userId}`);
                return;
            }
            const parameters = Object.assign({}, result.parameters, {
                FrameID: result.frameId
            });
            if (index === 0) {
                console.log(parameters);
            }
        })
    })
    .catch((err) => {
        console.log(err);
        return false;
    });