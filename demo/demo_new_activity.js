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

	const ACTIVITY_ID = 'FF_v2-1_Activity';
	const APP_PACKAGE_ID = 'FF_v2-1_AppPackage';

	const scope = ['data:read', 'bucket:read', 'code:all'];

	auth.two_leg(scope, function (error, cAuthObj) {
		if (error) {
			throw new Error(error.message ? error.message : error);
		}
		const authObj = cAuthObj;
		const da = forge.da(config, authObj);

		const filePath = __dirname + '/samplePlugin.bundle.zip';
		// var filePath = __dirname + '/../test/sample_files/samplePlugin.bundle.zip';
		const packageConfig = require(__dirname + '/configs/app_package.js')(APP_PACKAGE_ID);

		// Push the bundle
		da.app_packages.pushBundle(filePath, function (error, resource_url) {
			packageConfig['Resource'] = resource_url;
			console.log('Bundle pushed!');

			// Create the app package
			da.app_packages.create(packageConfig, function (error, success) {
				console.log('App package created!');
				// Get the app package
				da.app_packages.get(APP_PACKAGE_ID, function (error, response) {
					console.log(response);

					// Create an activity
					var activityConfig = require(__dirname + '/configs/activity.js')(ACTIVITY_ID, APP_PACKAGE_ID);

					da.activities.create(activityConfig, function (error, results) {
						console.log('Activity created!');
						da.activities.get(ACTIVITY_ID, function (error, response) {
							return callback(error, response)
						});
					});
				});
			});
		});
	});

}

run_new_activity(function (error, response) {
	if (error) console.log(error);
	else {
		console.log(response);
	}
});