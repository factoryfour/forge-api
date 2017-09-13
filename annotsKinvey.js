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

// Import packages
const fs = require('fs');
const https = require('https');
const s3urlFactory = require('./utils/s3urlFactory');
const aws = require('aws-sdk');

const s3 = new aws.S3({
	signatureVersion: 'v4',
	region: 'us-east-1'
});
// Initialize Forge interface
const FORGE_CONFIG = require(__dirname + '/get_config.js')(__dirname + '/config/forge_config.js');
const forge = require(__dirname + '/index.js');
const auth = forge.auth(FORGE_CONFIG);

// Get PQ configuration variables
const PQ_CONFIG = require(__dirname + '/config/pq_config.js');
// Get glasses configuration parameters
// const GLASSES_CONFIG = require(__dirname + '/config/glasses_config.js');


const kinveyConfig = require('./config/kinvey_config.js');
// console.log(kinveyConfig);
const datastore = require('@fusiform/kinvey')(kinveyConfig).dataStore;
const kinvey = require('kinvey-node-sdk');

const PREFIX = 'v2Nose6m';
const FRAME_BUCKET = 'f4-pq-frames-production';

const BEGIN = '151'; // Inclusive
const END = '157'; // Exclusive
const ONLY = ['405', '023']; // if empty uses range

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
			Key: `${PREFIX}/${jobFolder}/3DModel_${inArgs.Parameters.FrameID}.stl`,
			Bucket: FRAME_BUCKET
		}
	};
	s3urlFactory(s3params, (err, uploadURL) => {
		// Work item configuration JSON
		if (err) {
			throw err;
		}
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

function cleanParameters(unclean) {
	const safe = ['RightNoseAngle',
		'LeftNoseAngle',
		'RightNoseWidth',
		'LeftNoseWidth',
		'PupilDist',
		'SupMed_h',
		'SupLat_h',
		'InfLat_h',
		'InfMed_h',
		'SupMed_w',
		'SupLat_w',
		'InfLat_w',
		'InfMed_w',
		'SupMedRounding',
		'SupLatRounding',
		'InfLatRounding',
		'InfMedRounding',
		'SupMedThickness',
		'SupLatThickness',
		'InfLatThickness',
		'InfMedThickness',
		'BridgeHeight',
		'BridgeThickness',
		'TempleHeight',
		'HingeThickness',
		'RightTemple_yz',
		'LeftTemple_yz',
		'RightTemple_xz',
		'LeftTemple_xz',
		'Temple_length'];
	const clean = {};
	Object.keys(unclean).forEach((key) => {
		if (safe.indexOf(key) >= 0) {
			clean[key] = unclean[key];
		}
	});
	// clean.RightNoseWidth -= 0.7;
	// clean.LeftNoseWidth -= 0.7;
	// clean.Temple_length += 2;
	return clean;
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
		if (true && response.Arguments.OutputArguments[0].Resource) {
			// Name of the file when it is saved locally
			const downloadFileName = `3DModel_${inArgs.Parameters.FrameID}.stl`;
			console.log(`\n${outfile} : Downloading STL as ${downloadFileName}`);
			const stlFile = fs.createWriteStream(`stl/${downloadFileName}`);
			const s3params = {
				method: 'GET',
				s3: {
					Key: `${PREFIX}/${jobFolder}/${downloadFileName}`,
					Bucket: FRAME_BUCKET
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

const failures = [];


function job(parameters) {
	return new Promise((resolve) => {
		let finishTime;
		const jobID = parameters.userId + '-' + parameters.FrameID;
		const output = {
			userId: parameters.userId,
			frameId: parameters.FrameID,
			parameters
		};

		// setTimeout(() => {
		// 	return resolve(Object.assign(output, {
		// 		success: true
		// 	}));
		// }, 1000);

		const startTime = new Date();
		// Run the work item to modify the parameters at high resolution
		// runWorkItem(parameters, 0, jobID, (hiError, hiResponse) => {
		// 	if (hiError || hiResponse.Status != 'Succeeded') {
		// 		// If error, try again at a lower resolution
		// 		console.log(`${parameters.Name} : Job failed. Trying again at lower resolution.\n`);
		runWorkItem(parameters, 1, jobID, (loError, loResponse) => {
			finishTime = new Date();
			// Write the log file
			writeToFile(parameters, jobID, startTime, finishTime, loError, loResponse, false);

			if (loError || loResponse.Status != 'Succeeded') {
				return resolve(Object.assign(output, {
					success: false
				}));
			}
			return resolve(Object.assign(output, {
				success: true
			}));
		});
		// 	} else {
		// 		finishTime = new Date();
		// 		// Write the log file
		// 		writeToFile(parameters, jobID, startTime, finishTime, hiError, hiResponse, false);
		// 		return resolve(Object.assign(output, {
		// 			success: true
		// 		}));
		// 	}
		// });
	});
}

const final = [];

function pushJson(result) {
	console.log('job for user' + result.userId);
	return new Promise((resolve) => {
		setTimeout(() => {
			const jobID = result.userId + '-' + result.frameId;
			const params = {
				Key: `${PREFIX}/${jobID}/parameters_${result.frameId}.json`,
				Bucket: FRAME_BUCKET,
				Body: JSON.stringify(result, null, '\t')
			};
			s3.putObject(params, (err) => {
				if (err) {
					console.error('Unable to uplaod JSON', err);
					return resolve(result);
				}
				return resolve(result);
			});
		}, 1000);
	});
}

function workMyCollection(arr) {
	return arr.reduce((promise, item) => promise
		.then(() => job(item))
		.then(res => pushJson(res))
		.then(res => final.push(res))
		.then((result) => {
			console.log(final.map(val => ({
				userId: val.userId,
				success: val.success
			})));
			console.log(result);
			if (!final[result - 1].success) {
				failures.push(final[result - 1].userId);
			}
			return result;
		})
		.catch(console.error), Promise.resolve());
}


function getAll() {
	const query = new kinvey.Query();
	// query.notEqualTo('userId', '');
	query.ascending('userId');

	return datastore.query('configurations', query)
		.then((results) => {
			const final = [];

			results.forEach((result) => {
				if (!/^[A-Z]{4}$/.test(result.frameId)) {
					// console.log(`Incorrectly formatted frame Id for userId: ${result.userId}`);
					return;
				}
				if (ONLY.length > 0) {
					if (result.userId == '123') {
						console.log('found');
					}
					if (!ONLY.includes(result.userId)) {
						return;
					}
				} else if (parseInt(result.userId, 10) >= END || parseInt(result.userId, 10) < BEGIN) {
					return;
				}
				if (!/^[A-Z]{4}$/.test(result.frameId)) {
					// console.log(`Incorrectly formatted frame Id for userId: ${result.userId}`);
					return;
				}
				const parameters = {
					Parameters: Object.assign(cleanParameters(result.parameters), {
						FrameID: result.frameId
					}),
					FrameID: result.frameId,
					Name: `${result.userId}|${result.frameId}`,
					userId: result.userId
				};
				final.push(parameters);
			});
			console.log(final.map(user => user.userId));
			console.log(final.length);
			return final;
		});
}

function getConfigs() {
	const query = new kinvey.Query();
	// query.notEqualTo('userId', '');
	query.descending('_kmd.lmt');
	query.greaterThanOrEqualTo('_kmd.lmt', '2017-09-08T17:20:21.600Z');

	return datastore.query('landmarks', query)
		.then((results) => {
			console.log(results.length);
			return results;
		});
}

function searchForConfigs(item) {
	const query = new kinvey.Query();
	query.equalTo('userId', item.userId);
	query.greaterThanOrEqualTo('timestamp', 1504627604199);

	return datastore.query('configurations', query)
		.then((results) => {
			const output = results.map((config) => {
				const out = config;
				out.frameId = `6${config.frameId.substring(1)}`;
				out.parameters.LeftNoseWidth = item.configuration.noseLeftPosition * 10;
				out.parameters.RightNoseWidth = item.configuration.noseRightPosition * 10;
				return out;
			});
			return output;
		});
}
const aggregate = [];

function aggregateConfigs(results) {
	return results.reduce((promise, item) => promise
		.then(() => searchForConfigs(item))
		.then((resp) => aggregate.push(...resp))
		.catch(console.error), Promise.resolve());
}

// MAIN LOGIC =====================================================================================

getConfigs()
	.then(res => aggregateConfigs(res))
	.then(res => {
		const cleaned = [];
		console.log(aggregate);
		aggregate.forEach((result) => {
			// if (!/^[A-Z]{4}$/.test(result.frameId)) {
			// 	// console.log(`Incorrectly formatted frame Id for userId: ${result.userId}`);
			// 	return;
			// }
			if (ONLY.length > 0) {
				if (!ONLY.includes(result.userId)) {
					return;
				}
			} else if (parseInt(result.userId, 10) >= END || parseInt(result.userId, 10) < BEGIN) {
				return;
			}
			// if (!/^[A-Z]{4}$/.test(result.frameId)) {
			// 	// console.log(`Incorrectly formatted frame Id for userId: ${result.userId}`);
			// 	return;
			// }
			const parameters = {
				Parameters: Object.assign(cleanParameters(result.parameters), {
					FrameID: result.frameId
				}),
				FrameID: result.frameId,
				Name: `${result.userId}|${result.frameId}`,
				userId: result.userId
			};
			cleaned.push(parameters);
		});
		console.log(cleaned.map(user => user.userId));
		console.log(cleaned.length);
		return cleaned;
	})
	.then(res => workMyCollection(res))
	.then((res) => {
		console.log('completed');
		console.log('failures:', failures);
		return res;
	})
	.catch((err) => {
		console.log(err);
		return false;
	});