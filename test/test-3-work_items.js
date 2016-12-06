const should = require('should');
const async = require('async');

const root = __dirname.substring(0, __dirname.lastIndexOf('/'));
const config = require(__dirname + "/get_config.js")(root + '/config.js');
const forge = require(root + '/index.js');

describe('Work Item Methods', function() {
    var authObj;
    var da;
    const auth = forge.auth(config);
	var test_activity_id = 'TESTActivityWI';
	var test_package_id = 'TESTPackageWI';

    before(function(done) {
        this.slow(4000);
        this.timeout(10000);

        var tasks = [];

        tasks.push(function(callback) {
            var scope = ['data:read', 'bucket:read', 'code:all'];
            auth.two_leg(scope, function(error, cAuthObj) {
                if (error) {
                    throw new Error(error.message ? error.message : error);
                }
                authObj = cAuthObj;
                da = forge.da(config, authObj);

                return callback(null);
            });
        });

        tasks.push(function(callback) {

            var filePath = __dirname + '/sample_files/samplePlugin.bundle.zip';
            var packageConfig = require(__dirname + '/sample_configs/app_package.js')(test_package_id);

            da.app_packages.pushBundle(filePath, function(error, resource_url) {
                should.not.exist(error);
                packageConfig['Resource'] = resource_url;
                console.log("Sample bundle pushed!");

                return callback(null, packageConfig);
            });
        });

        tasks.push(function(packageConfig, callback) {
            da.app_packages.create(packageConfig, function(error, success) {
                console.log("Sample app package created!");
                if (error) {
                    return callback(error);
                }
                return callback(null);
            });
        });

        tasks.push(function(callback) {
            var activityConfig = require(__dirname + "/sample_configs/activity.js")(test_activity_id, test_package_id);

            da.activities.create(activityConfig, function(error, results) {
				console.log(results);
                should.not.exist(error);
                should.exist(results);
                return callback(error);
            });
        });


        async.waterfall(tasks, function(error, results) {
            should.not.exist(error);
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

    it('workItemTests-02 - should be able to create an activity', function(done) {
		var workItemConfig = require(__dirname + '/sample_configs/work_item.js')(test_activity_id);

        da.work_items.create(workItemConfig, function(error, results) {
            should.not.exist(error);
            should.exist(results);
			var err = results.error;
			console.log(err);
			should.not.exist(err);
            done();
        });
    });
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

    after(function(done) {
        var tasks = [];

        tasks.push(function(callback) {
            da.activities.delete(test_activity_id, function(error, results) {
                console.log("Sample activity deleted!");
                should.not.exist(error);
                should.exist(results);
                return callback(error, true)
            });
        });

        tasks.push(function(callback) {
            da.app_packages.delete(test_package_id, function(error, results) {
                console.log("Sample app package deleted!");
                should.not.exist(error);
                should.exist(results);
                return callback(error, true)
            });
        });

		async.series(tasks, function(error, results) {
			should.not.exist(error);
			done();
		});
    });
});
