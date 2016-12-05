var should = require('should');

const root = __dirname.substring(0, __dirname.lastIndexOf('/'));
const config = require(root + '/config.js');
const forge = require(root + '/index.js');

describe('Activity Methods', function() {
    var authObj;
    var da;
    const auth = forge.auth(config);
	var test_id = 'TESTActivity';

    before(function(done) {
        var scope = ['data:read', 'bucket:read', 'code:all']

        auth.two_leg(scope, function(error, cAuthObj) {
            if (error) {
                throw error;
            }
            authObj = cAuthObj;
            da = forge.da(config, authObj);
            done();
        });
    });

    it('activityTests-01 - should be able to list all activities', function(done) {
        da.activities.getAll(function(error, results) {
            should.not.exist(error);
            should.exist(results);
			if (process.env.VERBOSE == 'loud') {
	            console.log(results);
			}
            done();
        });
    });

    it('activityTests-02 - should be able to get a single activity', function(done) {
        var activityConfig = {
            AppPackages: ['samplePlugin'],
            HostApplication: '',
            RequiredEngineVersion: '21.17',
            Parameters: {
                InputParameters: [{
                    Name: 'HostDwg',
                    LocalFileName: 'pencil.ipt',
                    Optional: null
                }, {
                    Name: 'ChangeParameters',
                    LocalFileName: 'changeParameters.json',
                    Optional: null
                }],
                OutputParameters: [{
                    Name: 'Result',
                    LocalFileName: 'Output.stl',
                    Optional: null
                }]
            },
            Instruction: {
				Script: "hi there",
                CommandLineParameters: 'changeParameters.json Output.stl'
            },
            AllowedChildProcesses: [],
            IsPublic: true,
            Version: 1,
            Timestamp: (new Date()).toISOString(),
            Description: 'A sample activity for testing purposes',
            Id: test_id
        }

        da.activities.create(activityConfig, function(error, results) {
            should.not.exist(error);
            should.exist(results);
			if (process.env.VERBOSE == 'loud') {
	            console.log(results);
			}
            done();
        });
    });

    it('activityTests-03 - should be able to get a single activity', function(done) {
        da.activities.get(test_id, function(error, results) {
            should.not.exist(error);
            should.exist(results);
			if (process.env.VERBOSE == 'loud') {
	            console.log(results);
	            console.log("===============");
	            console.log(results.Parameters);
			}
            done();
        });
    });

	it('activityTests-04 - should be able to delete a single activity', function(done) {

		da.activities.delete(test_id, function(error, results) {
			should.not.exist(error);
			should.exist(results);
			if (process.env.VERBOSE == 'loud') {
	            console.log(results);
			}
			done();
		});
	});
});
