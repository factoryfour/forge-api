/* File to query Kinvey for glasses configurations */

const KinveyQuery = require('kinvey-node-sdk').Query;

const COLLECTION = 'configurations';

const parametersQuery = (kinvey, rowIds, callback) => {
	const configurations = [];
	rowIds.forEach((rowId) => {
		return kinvey.dataStore
			.getObject(COLLECTION, rowId)
			.then((entity) => {
				console.log(entity);
				// configurations.push(entity.parameters);
			})
			.catch((err) => {
				console.log(`Unable to search for row: ${rowId}`);
			});
	});
	return callback(configurations);
};

module.exports = parametersQuery;
