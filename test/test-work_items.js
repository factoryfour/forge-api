var should = require('should');

const root = __dirname.substring(0, __dirname.lastIndexOf('/'));
const config = require(root + '/config.js');
const forge = require(root + '/index.js');

describe('Work Item Methods', function() {
	var authObj;
	var da;
	const auth = forge.auth(config);

    before(function(done){
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
            done();
        });
    });

    it('workItemTests-02 - should be able to get a single work item', function(done) {
        da.work_items.get('95397e28ab4c4ce390007233dd42f1c4', function(error, results) {
            should.not.exist(error);
            should.exist(results);
			console.log(results);
			console.log("==========");
			console.log(results.Arguments);
            done();
        });
    });
});
