var should = require('should');

var os = require('os');

// Check platform to handle file path issues
var isWin = os.platform().indexOf('win') > -1
if (isWin) {
  var root = __dirname.substring(0, __dirname.lastIndexOf('\\'));
}
else {
  var root = __dirname.substring(0, __dirname.lastIndexOf('/'));
}
const config = require(__dirname + "/get_config.js")(root + '/config.js');
const forge = require(root + '/index.js');

describe('Work Item Methods', function() {
    var authObj;
    var da;
    const auth = forge.auth(config);

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

    it('workItemTests-01 - should be able to list all work items', function(done) {
        da.work_items.getAll(function(error, results) {
            should.not.exist(error);
            should.exist(results);
            if (process.env.VERBOSE == 'loud') {
                console.log(results);
            }
            done();
        });
    });

	//
    // it('workItemTests-02 - should be able to create an activity', function(done) {
    //     var workItemConfig = {
    //         Arguments: {
    //             InputArguments: [{
    //                 Resource: "https://s3-us-west-2.amazonaws.com/inventor-io-samples/Box.ipt",
    //                 Name: "HostDwg",
    //                 StorageProvider: "Generic"
    //             }, {
    //                 Resource:  'data:application/json,{\"d2\":\"0.5 in\", \"d3\":\"0.2 in\"}',
    //                 Name: 'ChangeParameters',
    //                 StorageProvider: 'Generic'
    //             }],
    //             OutputArguments: [{
    //                 Name : "Result",
    //                 StorageProvider : "Generic",
    //                 HttpVerb : "POST"
    //             }]
    //         },
    //         ActivityId: "SampleActivity",
	// 		Id:""
    //     }
	//
    //     da.work_items.create(workItemConfig, function(error, results) {
    //         should.not.exist(error);
    //         should.exist(results);
    //         if (process.env.VERBOSE == 'loud') {
    //             console.log(results);
	// 			console.log(results.error.innererror.stacktrace);
    //         }
    //         done();
    //     });
    // });
	//
    // it('workItemTests-03 - should be able to get a single work item', function(done) {
    //     da.work_items.get('95397e28ab4c4ce390007233dd42f1c4', function(error, results) {
    //         should.not.exist(error);
    //         should.exist(results);
    //         if (process.env.VERBOSE == 'loud') {
    //             console.log(results);
    //             console.log("==========");
    //             console.log(results.Arguments);
    //         }
    //         done();
    //     });
    // });
});
