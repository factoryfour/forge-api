/* File to query Kinvey for glasses configurations */

const COLLECTION = 'configurations';

const parametersQuery = (kinvey, rowIds, callback) => {
	const configurations = [];
	rowIds.forEach(rowId =>
		kinvey.datastore
			.getObject(COLLECTION, rowId)
			.then((entity) => {
				configurations.push(entity.parameters);
				return true;
			})
	);
	return callback(configurations);
};

module.exports = parametersQuery;
