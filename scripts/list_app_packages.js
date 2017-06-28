// Configuration variables ==========================================

const APP_PACKAGE_ID = 'FF_AppPackage_9';

// Start main logic =================================================

const os = require('os');

function run_new_activity(callback) {

	// Check platform to handle file path issues
	const isWin = os.platform().indexOf('win32') > -1;
	let root;
	if (isWin) {
		root = __dirname.substring(0, __dirname.lastIndexOf('\\'));
	} else {
		root = __dirname.substring(0, __dirname.lastIndexOf('/'));
	}

	// Initialize Forge interface
	const config = require(__dirname + '/get_config.js')(root + '/config.js');
	const forge = require(root + '/index.js');
	const auth = forge.auth(config);

	const scope = ['data:read', 'bucket:read', 'code:all'];

	auth.two_leg(scope, function (error, cAuthObj) {
		if (error) {
			throw new Error(error.message ? error.message : error);
		}
		const authObj = cAuthObj;
		const da = forge.da(config, authObj);

		// const filePath = __dirname + '/samplePlugin.bundle.zip';
		// const filePath = __dirname + '/../test/sample_files/samplePlugin.bundle.zip';

		// Get all bundles
		da.activities.getAll((error, response) => {
			console.log(response.value.length);
			for (var i = 0; i < response.value.length; i++) {
				console.log(response.value[i].Id);
			}
		});
		// Get a bundle
		// da.app_packages.get(APP_PACKAGE_ID, (error, response) => {
		// 	console.log(response);
		// 	console.log(response['Resource']);
		// });
	});
}

run_new_activity(function (error, response) {
	if (error) console.log(error);
	else {
		console.log(response);
	}
});
