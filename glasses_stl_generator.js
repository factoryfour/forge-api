/**
 * Script to run parameter modification for multiple parts.
 */

const fs = require('fs');

/**
 * Return a work item config JSON, selecting app package based on resolution.
 * @param {*} inArgs - arguments JSON
 * @param {*} resolution - 0 for high resolution, 1 for medium resolution
 * inArgs must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function formatWorkItemConfig(inArgs, resolution) {
	// Work item configuration JSON
	const config = {
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
		Id: ''
	};
	switch (resolution) {
	case 0:
		config.ActivityId = 'FF_v2-4_Activity';		// hi res with combo directset/ilogic
		break;
	case 1:
		config.ActivityId = 'FF_v2-5_Activity';		// med res with combo directset/ilogic
		break;
	default:
		config.ActivityId = 'FF_v2-5_Activity';		// med res with combo directset/ilogic
		break;
	}
	return config;
}

/**
 * Run a work item for glasses design automation.
 * @param {*} inArgs - design parameters
 * @param {*} resolution - 0 for high resolution, 1 for medium resolution
 * @param {*} callback (error, response)
 * inArgs must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function runWorkItem(inArgs, resolution, callback) {
	// Initialize Forge interface
	const config = require(__dirname + '/get_config.js')(__dirname + '/config.js');
	const forge = require(__dirname + '/index.js');
	const auth = forge.auth(config);

	const workItemConfig = formatWorkItemConfig(inArgs, resolution);

	// Declare scope
	const scope = ['data:read', 'bucket:read', 'code:all'];
	// Get the auth token
	auth.two_leg(scope, function (authError, cAuthObj) {
		if (authError) {
			throw authError;
		}
		// Set up design automation with auth object
		const da = forge.da(config, cAuthObj);

		// Create a work item
		da.work_items.create(workItemConfig, (createError, createResponse) => {
			// Log results of creating a work item
			console.log(`${inArgs.Name} : Work item created\n`);
			if (createError) {
				console.log('ERROR: CREATING WORK ITEM');
				return callback(createError, createResponse);
			}
			console.log(`${inArgs.Name} : Checking status...\n`);

			// Save the work item id
			const responseId = createResponse.Id;
			// Check the status of the work item at a fixed interval
			const intervalObject = setInterval(() => {
				// Poll the work item's status
				da.work_items.get(responseId, (getError, getResponse) => {
					if (getError) {
						// Stop if there's an error
						console.log('ERROR: CHECKING STATUS');
						console.log(getError);

						clearInterval(intervalObject);
						return callback(getError, getResponse);
					} else if (!(getResponse.Status == 'Pending' || getResponse.Status == 'InProgress')) {
						// If it is finished
						clearInterval(intervalObject);
						return callback(getError, getResponse);
					}
					// Otherwise, log the status and repeat
					const mytime = new Date();
					console.log(`${inArgs.Name} : ${getResponse.Status} : ${mytime}`);
				});
			}, 5000); // Check every 5 seconds
		});
	});
}

/**
 * Validate parameters
 * @param {*} params - Parameters JSON
 * Must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function check_params(params) {
	const validParams = [];
	const invalidParams = [];
	// Make sure it's an array. If only one, put it in an array.
	if (!Array.isArray(params)) {
		params = [params];
	}
	// Check that parameters have all required fields.
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

// MAIN LOGIC =====================================================================================

const args = process.argv.slice(2);
if (args.length < 1) {
	console.log('ERROR: Not enough arguments. Must specify parameters file.');
} else {
	// Read parameters file
	const inparams = require(args[0]);
	// Validate parameters
	const validParams = check_params(inparams);
	validParams.forEach((params) => {
		const outfile = params.Name;
		const startTime = new Date();
		// Run the work item to modify the parameters
		runWorkItem(params, 0, function (error, response) {
			const finishTime = new Date();
			if (error) {
				let outStr = 'ERROR: Process failed at ' + finishTime.toString() + '\n';
				outStr += '\nERROR:\n' + error;
				outStr += '\nRESPONSE:\n' + response;
				fs.writeFile('./output/' + outfile + '.log', outStr, (err) => {
					if (err) {
						return console.log(err);
					}
					console.log(`\n${outfile} : Process finished.\nOutput written to file: ${outfile}.log`);
				});
			} else {
				// Write log file
				let outStr = 'Process started at ' + startTime.toString() + '\n';
				outStr += 'Process completed at ' + finishTime.toString() + '\n';
				outStr += `Runtime: ${finishTime - startTime} \n`;
				outStr += '\n===== Output from Forge =====\n';
				outStr += JSON.stringify(response, null, 4);

				outStr += '\n\n===== Process Report URL =====\n';
				outStr += response.StatusDetails.Report;

				outStr += '\n\n===== Modified STL URL =====\n';
				outStr += response.Arguments.OutputArguments[0].Resource;

				fs.writeFile('output/' + outfile + '.log', outStr, (err) => {
					if (err) {
						return console.log(err);
					}
					console.log(`\n${outfile} : Process finished.\nOutput written to file: ${outfile}.log`);
				});
			}
		});
	});
}
