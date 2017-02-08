var os = require('os');

function do_the_thing(callback) {

	// Check platform to handle file path issues
	var isWin = os.platform().indexOf('win') > -1
	if (isWin) {
		var root = __dirname.substring(0, __dirname.lastIndexOf('\\'));
	}
	else {
		var root = __dirname.substring(0, __dirname.lastIndexOf('/'));
	}
	// Initialize Forge interface
	const config = require(__dirname + "/get_config.js")(root + '/config.js');
	const forge = require(root + '/index.js');
	const auth = forge.auth(config);

	var scope = ['data:read', 'bucket:read', 'code:all']
	// Get the auth token
	auth.two_leg(scope, function (error, cAuthObj) {
		if (error) {
			throw error;
		}
		var authObj = cAuthObj;
		// Set up design automation with auth object
		var da = forge.da(config, authObj);

		da.activities.getAll(function (error, response) {
			console.log(error);
			console.log(response.value);
		
		// 	// for (v in response.value) {
		// 	// 	console.log(value[v]);
		// 	// }
		})

		// da.activities.get('rectangle', function (error, response) {
		// 	console.log(error);
		// 	console.log(response);
		// })
	});

}

// =============================================================================

do_the_thing(function (error, response) {
	if (error) console.log(error);
	else {
		console.log(response);
		// console.log(response.value.length);
	}
})
