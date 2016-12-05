const request = require('request');
const fs = require('fs');

module.exports = function(config, authObj) {
    var activities = {};

	activities.create = function(activityConfig, callback) {
		authObj.getToken(function(error, token) {
			if (error) {
				return callback(error, null);
			}

			var options = {
				method: 'POST',
				url: config.BASE_URL + 'Activities',
				headers: {
					authorization: 'Bearer ' + token
				},
				form: activityConfig
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

    activities.getAll = function(callback) {
        authObj.getToken(function(error, token) {
            if (error) {
                return callback(error, null);
            }

            var options = {
                method: 'GET',
                url: config.BASE_URL + 'Activities',
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

    activities.get = function(id, callback) {
        authObj.getToken(function(error, token) {
            if (error) {
                return callback(error, null);
            }

            var options = {
                method: 'GET',
                url: config.BASE_URL + 'Activities(\'' + id + '\')',
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

    activities.delete = function(id, callback) {
        authObj.getToken(function(error, token) {
            if (error) {
                return callback(error, null);
            }

            var options = {
                method: 'DELETE',
                url: config.BASE_URL + 'Activities(\'' + id + '\')',
                headers: {
                    authorization: 'Bearer ' + token
                }
            };

            request(options, function(error, response, body) {
                if (error) return callback(Error(error), null);
                if (response.statusCode != 204) {
                    return callback("Deletion Failed", null);
                }
                return callback(null, true)
            });
        });
    };

    return activities;

}
