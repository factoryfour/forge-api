const request = require('request');
const fs = require('fs');

module.exports = function(config, authObj) {
    var app_packages = {};

    app_packages.getAll = function(callback) {
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

    app_packages.getUploadUrl = function(callback) {
        authObj.getToken(function(error, token) {
            if (error) {
                return callback(error, null);
            }

            var options = {
                method: 'GET',
                url: config.BASE_URL + 'AppPackages/Operations.GetUploadUrl',
                headers: {
                    authorization: 'Bearer ' + token
                }
            };

            request(options, function(error, response, body) {
                if (error) return callback(Error(error), null);
                try {
                    var parsed = JSON.parse(body);
                    return callback(null, parsed.value);
                } catch (e) {
                    return callback("Error parsing response.", null)
                } finally {

                }
            });
        });
    };

    app_packages.create = function(packageConfig, callback) {
        authObj.getToken(function(error, token) {
            if (error) {
                return callback(error, null);
            }

            var options = {
                method: 'POST',
                url: config.BASE_URL + 'AppPackages',
                headers: {
                    authorization: 'Bearer ' + token
                },
                form: packageConfig
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

    app_packages.pushBundle = function(filePath, callback) {
        app_packages.getUploadUrl(function(error, upload_url) {
            if (error) {
                return callback(error);
            }
            var url = upload_url.split('?')[0];
            fs.readFile(filePath, function(err, data) {
                if (err) {
                    return console.log(err);
                }
                request({
                    method: "PUT",
                    url: upload_url,
                    body: data
                }, function(error, res, body) {
					if (error) {
						return callback(error);
					}
					return callback(null, url);
                })
            });
        });
    }

    return app_packages;

}
