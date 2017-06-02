const os = require('os');
const fs = require('fs');

function run_work_item(inArgs, callback) {
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

	// Work item configuration JSON
	const workItemConfig = {
		Arguments: {
			InputArguments: [
				// Specify the input part
				{
					Resource: inArgs.Part,
					Name: 'HostDwg',
					StorageProvider: 'Generic',
					HttpVerb: 'GET'
				},
				// Change the parameters
				{
					Resource: 'data:application/json,' + JSON.stringify(inArgs.Parameters),
					Name: 'ChangeParameters',
					StorageProvider: 'Generic',
					ResourceKind: 'Embedded'
				}
			],
			// Output arguments
			OutputArguments: [
				{
					Name: 'Result',
					StorageProvider: 'Generic',
					HttpVerb: 'POST'
				}
			]
		},
		ActivityId: 'SampleActivity',
		Id: ''
	};

	// Declare scope
	const scope = ['data:read', 'bucket:read', 'code:all'];
	// Get the auth token
	auth.two_leg(scope, function (error, cAuthObj) {
		if (error) {
			throw error;
		}
		// Set up design automation with auth object
		const da = forge.da(config, cAuthObj);

		// Create a work item
		da.work_items.create(workItemConfig, (error, response) => {
			// Log results of creating a work item
			console.log(`${inArgs.Name} : Work item created\n`);
			if (error) {
				console.log('ERROR: CREATING WORK ITEM');
				return callback(error, response);
			}
			console.log(`${inArgs.Name} : Checking status...\n`);

			// Save the work item id
			const responseId = response.Id;
			// Check the status of the work item at a fixed interval
			const intervalObject = setInterval(() => {
				// Poll the work item's status
				da.work_items.get(responseId, (error, response) => {
					if (error) {
						// Stop if there's an error
						console.log('ERROR: CHECKING STATUS');
						clearInterval(intervalObject);
						return callback(error, response);
					} else if (!(response.Status == 'Pending' || response.Status == 'InProgress')) {
						// If it is finished
						clearInterval(intervalObject);
						return callback(error, response);
					}
					// Otherwise, log the status and repeat
					console.log(`${inArgs.Name} : ${response.Status}`);
				});
			}, 2000); // Check every 2 seconds
		});
	});
}

function check_params(params) {
	const validParams = [];
	const invalidParams = [];
	// Make sure it's an array. If only one, put it in an array.
	if (!Array.isArray(params)) {
		params = [params];
	}
	params.forEach((param) => {
		if (!param.Name || !param.Part || !param.Parameters) {
			invalidParams.push(param);
		} else {
			validParams.push(param);
		}
	});
	// Print the invalid parameter sets
	if (invalidParams.length > 0) {
		console.log('WARNING: The following parameter sets were invalid because they were missing one or more required fields.');
		console.log('Must supply Name, Part, and Parameter fields.');
		console.log(invalidParams);
	}

	return validParams;
}

// MAIN LOGIC ===================================================================

const args = process.argv.slice(2);
if (args.length < 1) {
	console.log('ERROR: Not enough arguments. Must specify parameters file and job name.');
} else {
	// Read parameters file
	const inparams = require(args[0]);
	// Validate parameters
	const validParams = check_params(inparams);
	validParams.forEach((params) => {
		const outfile = params.Name;
		// Run the work item to modify the parameters
		run_work_item(params, function (error, response) {
			const finishTime = new Date();
			if (error) {
				let outStr = 'ERROR: Process failed at ' + finishTime.toString() + '\n';
				outStr += '\nERROR:\n' + error;
				outStr += '\nRESPONSE:\n' + response;
				fs.writeFile('../output/' + outfile + '.log', outStr, (err) => {
					if (err) {
						return console.log(err);
					}
					console.log(`\n${outfile} : Process finished.\nOutput written to file: ${outfile}.log`);
				});
			} else {
				// Write log file
				let outStr = 'Process completed at ' + finishTime.toString() + '\n';
				outStr += '\n===== Output from Forge =====\n';
				outStr += JSON.stringify(response, null, 4);

				outStr += '\n\n===== Process Report URL =====\n';
				outStr += response.StatusDetails.Report;

				outStr += '\n\n===== Modified STL URL =====\n';
				outStr += response.Arguments.OutputArguments[0].Resource;

				fs.writeFile('../output/' + outfile + '.log', outStr, (err) => {
					if (err) {
						return console.log(err);
					}
					console.log(`\n${outfile} : Process finished.\nOutput written to file: ${outfile}.log`);
				});
			}
		});
	});
}
