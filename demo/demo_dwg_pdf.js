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

	var workItemConfig = {
		Arguments: {
			InputArguments: [
				{
					Resource: "https://s3-us-west-2.amazonaws.com/inventor-io-samples/Box.ipt",
					Name: "HostDwg",
					StorageProvider: "Generic",
					HttpVerb: "GET"
				},
				// { // this is required
				//     'Name': 'PluginSettings',
				//     'Resource': 'data:application/json,{}',
				//     'StorageProvider': 'Generic',
				//     'ResourceKind': 'Embedded'
				// },
				{
					Resource:  'data:application/json,{\"d1\":\"0.3 in\", \"d2\":\"0.5 in\"}',
					// Resource: 'data:application/json,{\"d2\":\"0.3 in\"}',
					Name: 'ChangeParameters',
					StorageProvider: 'Generic',
					ResourceKind: 'Embedded'
				}
			],
			OutputArguments: [
				{
					Name: "Result",
					StorageProvider: "Generic",
					HttpVerb: "POST",
					ResourceKind: "ZipPackage"
				}
			]
		},
		ActivityId: "SampleActivity",
		Id: ""
	}

	var scope = ['data:read', 'bucket:read', 'code:all']
	// Get the auth token
	auth.two_leg(scope, function (error, cAuthObj) {
		if (error) {
			throw error;
		}
		var authObj = cAuthObj;
		// Set up design automation with auth object
		var da = forge.da(config, authObj);

		// Create a work item
		da.work_items.create(workItemConfig, function (error, response) {
			console.log(error);
			console.log(response);
			if (error) {
				console.log("ERROR: CREATING WORK ITEM");
				return callback(error, response)
			}
			else {
				var responseId = response.Id;
				var intervalObject = setInterval(function () {
					da.work_items.get(responseId, function (error, response) {
						// console.log(error);
						// console.log(response);
						if (error) {
							console.log("ERROR: CHECKING STATUS");
							clearInterval(intervalObject)
							return callback(error, response)
						}
						else if (!(response.Status == 'Pending' || response.Status == 'InProgress')) {
							// console.log(response);
							clearInterval(intervalObject)
							return callback(error, response)
						}
						else {
							console.log(response.Status);
						}
					})

				}, 1000); // Check every 1 second
			}
		})
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
