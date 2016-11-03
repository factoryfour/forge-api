var request = require('request');

module.exports = function(config, authObj) {
    var app_packages = {};

    app_packages.get_all = function(callback) {
		authObj.getToken(function(error, token) {
			if (error) {
				return callback(error, null);
			}

			var options = {
	            method: 'GET',
	            url: config.BASE_URL + 'AppPackages',
				headers: {
					authorization: 'Bearer ' + token
				}
	        };

	        request(options, function(error, response, body) {
	            if (error) return callback(Error(error), null);
				try {
					var parsed = JSON.parse(body);
					return callback(null, parsed);
				} catch (e) {
					return callback("Error parsing response.", null)
				} finally {

				}
	        });
		});
    };
	//
	// app_packages.get = function(id, callback) {
	// 	authObj.getToken(function(error, token) {
	// 		if (error) {
	// 			return callback(error, null);
	// 		}
	//
	// 		var options = {
	// 			method: 'GET',
	// 			url: config.BASE_URL + 'Engines(\'' + id + '\')',
	// 			headers: {
	// 				authorization: 'Bearer ' + token
	// 			}
	// 		};
	//
	// 		request(options, function(error, response, body) {
	// 			if (error) return callback(Error(error), null);
	// 			try {
	// 				var parsed = JSON.parse(body);
	// 				return callback(null, parsed);
	// 			} catch (e) {
	// 				return callback("Error parsing response.", null)
	// 			} finally {
	//
	// 			}
	// 		});
	// 	});
	// };

    return app_packages;

}
