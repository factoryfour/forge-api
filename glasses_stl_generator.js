/* eslint
import/no-dynamic-require: 'off',
no-path-concat: 'off',
consistent-return: 'off',
vars-on-top: 'off',
no-var: 'off',
global-require: 'off',
prefer-template:'off',
no-console: 'off'
*/

/**
 * Script to run parameter modification for multiple parts.
 */

// Import packages
const fs = require('fs');
const https = require('https');
const s3urlFactory = require('./utils/s3urlFactory');

// Initialize Forge interface
const FORGE_CONFIG = require(__dirname + '/get_config.js')(__dirname + '/config/forge_config.js');
const forge = require(__dirname + '/index.js');
const auth = forge.auth(FORGE_CONFIG);

// Get PQ configuration variables
const PQ_CONFIG = require(__dirname + '/config/pq_config.js');
// Get glasses configuration parameters
const GLASSES_CONFIG = require(__dirname + '/config/glasses_config.js');

/**
 * Validate parameters
 * @param {*} params - Parameters JSON
 * Must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function checkParams(params) {
	const validParams = [];
	const invalidParams = [];

	// Make sure it's an array. If only one, put it in an array.
	if (!Array.isArray(params)) {
		params = [params];
	}
	// Check that parameters have all required fields.
	params.forEach((param) => {
		if (!param.Name || !param.Parameters) {
			invalidParams.push(param);
		} else {
			let invalid = false;
			Object.keys(param.Parameters).forEach((paramName) => {
				if (GLASSES_CONFIG.Parameters.indexOf(paramName) < 0) {
					invalid = true;
				}
			});
			if (invalid) {
				invalidParams.push(param);
			} else {
				validParams.push(param);
			}
		}
	});
	// Print the invalid parameter sets
	if (invalidParams.length > 0) {
		console.log('\x1b[33m%s\x1b[0m', '\n############################################');
		console.log('\x1b[33m%s\x1b[0m', 'WARNING: The following parameter sets were invalid because of one or more missing or incorrect fields.');
		console.log('\x1b[33m%s\x1b[0m', 'Must supply Name, Part, and Parameter fields.');
		console.log('\x1b[33m%s\x1b[0m', 'Check that all glasses parameters are correct.');
		console.log('\x1b[33m%s\x1b[0m', '############################################\n');
		console.log('\x1b[33m%s\x1b[0m', JSON.stringify(invalidParams, null, 4));
	}
	return validParams;
}

/**
 * Return a work item config JSON, selecting app package based on resolution.
 * @param {*} inArgs - arguments JSON
 * @param {*} resolution - 0 for high resolution, 1 for medium resolution
 * @param {*} jobFolder - directory corresponding to job
 * inArgs must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function formatWorkItemConfig(inArgs, resolution, jobFolder, callback) {
	// Create upload URL
	// const uploadURL = `${process.env.F4PQ_S3_BASE}${jobFolder}/${inArgs.Name}.stl`;
	const s3params = {
		method: 'PUT',
		s3: {
			Key: `${jobFolder}/3DModel_${inArgs.Parameters.FrameID}.stl`,
			Bucket: process.env.F4PQ_S3_BASE
		}
	};
	s3urlFactory(s3params, (err, uploadURL) => {
		// Work item configuration JSON
		const config = {
			Arguments: {
				InputArguments: [
					// Specify the input part
					{
						Resource: PQ_CONFIG.IPT_BASE,
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
						HttpVerb: 'PUT',
						Resource: uploadURL
					}
				]
			},
			Id: ''
		};
		switch (resolution) {
		case 0:
			config.ActivityId = 'FF_v2-7_Activity';		// hi res with combo directset/ilogic, mm
			break;
		case 1:
			config.ActivityId = 'FF_v2-8_Activity';		// med res with combo directset/ilogic, mm
			break;
		default:
			config.ActivityId = 'FF_v2-8_Activity';		// med res with combo directset/ilogic, mm
			break;
		}
		return callback(config);
	});
}

/**
 * Run a work item for glasses design automation.
 * @param {*} inArgs - design parameters
 * @param {*} resolution - 0 for high resolution, 1 for medium resolution
 * @param {*} folder - directory corresponding to job
 * @param {*} callback (error, response)
 * inArgs must have fields:
 * - name: job name
 * - part: link to IPT
 * - parameters: model parameters to change
 */
function runWorkItem(inArgs, resolution, folder, callback) {
	formatWorkItemConfig(inArgs, resolution, folder, (workItemConfig) => {
		// Declare scope
		const scope = ['data:read', 'bucket:read', 'code:all'];
		// Get the auth token
		auth.two_leg(scope, (authError, cAuthObj) => {
			if (authError) {
				throw authError;
			}
			// Set up design automation with auth object
			const da = forge.da(FORGE_CONFIG, cAuthObj);

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
	});
}

/**
 * Write log file (and download STL)
 * @param {String} outfile - name of file to write
 * @param {String} startTime - timecode that job started
 * @param {String} finishTime - timecode that job finished
 * @param {*} error
 * @param {*} response
 * @param {boolean} getSTL - should STL be downloaded?
 */
function writeToFile(inArgs, jobFolder, startTime, finishTime, error, response, getSTL) {
	const outfile = inArgs.Name;
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
				console.log(err);
			}
			console.log(`\n${outfile} : Process finished.\nOutput written to file: ${outfile}.log`);
		});

		// Download the STL? Have a valid URL?
		if (getSTL && response.Arguments.OutputArguments[0].Resource) {
			// Name of the file when it is saved locally
			const downloadFileName = `3DModel_${inArgs.Parameters.FrameID}.stl`;
			console.log(`\n${outfile} : Downloading STL as ${downloadFileName}`);
			const stlFile = fs.createWriteStream(`stl/${downloadFileName}`);
			const s3params = {
				method: 'GET',
				s3: {
					Key: `${jobFolder}/${downloadFileName}`,
					Bucket: process.env.F4PQ_S3_BASE
				}
			};
			s3urlFactory(s3params, (err, downloadURL) => {
				https.get(downloadURL, (data) => {
					data.pipe(stlFile);
					stlFile.on('finish', () => {
						stlFile.close();
						console.log(`\n${outfile} : STL written to file: ${downloadFileName}`);
					});
				});
			});
		}
	}
}

/**
 * Remove flags from array of command line arguments.
 * @param {Array} arr - array of command line arguments
 */
function removeFlags(arr) {
	const cleanArr = [];
	for (var i = 0; i < arr.length; i += 1) {
		if (arr[i].substring(0, 1) != '-') {
			cleanArr.push(arr[i]);
		}
	}
	return cleanArr;
}

// MAIN LOGIC =====================================================================================

try {
	const args = process.argv.slice(2);
	if (args.length < 1) {
		console.log('ERROR: Not enough arguments. Must specify parameters file [and optional job name].');
		console.log('USE: node glasses_stl_generator.js [--dev, --prod] [--save] ./path/to/parameters [job_name]');
	} else {
		// Parse command line arguments
		const lowerArgs = args.join('|').toLowerCase().split('|');
		process.env.F4PQ_S3_BASE = lowerArgs.indexOf('--prod') > -1 ? PQ_CONFIG.PROD_S3_BASE : PQ_CONFIG.DEV_S3_BASE;
		process.env.GET_STL = lowerArgs.indexOf('--save') > -1;
		// Remove flags from the arguments array
		const cleanArgs = removeFlags(args);

		// Read parameters file
		const inparams = require(cleanArgs[0]);
		// Validate parameters
		const validParams = checkParams(inparams);

		const startTime = new Date();

		const jobID = (cleanArgs.length == 2) ? cleanArgs[1] : startTime.getTime();
		// For all sets of parameters, run a work item
		validParams.forEach((params) => {
			// Download STL?
			const stlFlag = params.DownloadSTL || PQ_CONFIG.GET_STL || process.env.GET_STL;
			let finishTime;
			// Run the work item to modify the parameters at high resolution
			runWorkItem(params, 0, jobID, (hiError, hiResponse) => {
				if (hiError || hiResponse.Status != 'Succeeded') {
					// If error, try again at a lower resolution
					console.log(`${params.Name} : Job failed. Trying again at lower resolution.\n`);
					runWorkItem(params, 1, jobID, (loError, loResponse) => {
						finishTime = new Date();
						// Write the log file
						return writeToFile(params, jobID, startTime, finishTime, loError, loResponse, stlFlag);
					});
				} else {
					finishTime = new Date();
					// Write the log file
					return writeToFile(params, jobID, startTime, finishTime, hiError, hiResponse, stlFlag);
				}
			});
		});
	}
} catch (e) {
	console.log('ERROR!');
	console.log(e);
}
