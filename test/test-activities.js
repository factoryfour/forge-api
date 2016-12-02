var should = require('should');

const root = __dirname.substring(0, __dirname.lastIndexOf('/'));
const config = require(root + '/config.js');
const forge = require(root + '/index.js');

describe('Activity Methods', function() {
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

    it('activityTests-01 - should be able to list all vaults', function(done) {
        da.activities.getAll(function(error, results) {
            should.not.exist(error);
            should.exist(results);
            done();
        });
    });
});
