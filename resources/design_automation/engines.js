var request = require('request');

module.exports = function(config) {
    var engines = {};

    engines.two_leg = function(scope, callback) {

        if (!scope || !Array.isArray(scope)) {
            return callback("Provided scope must be an array.")
        }

        var scope_string = "";
        scope.forEach(function(scopeElement) {
            scope_string += scopeElement + " ";
        })

        var options = {
            method: 'GET',
            url: 'https://developer.api.autodesk.com/autocad.io/us-east/v2/Engines',
            form: {
                client_id: config.CLIENT_ID,
                client_secret: config.CLIENT_SECRET,
                grant_type:'client_credentials',
                scope:scope_string
            }
        };

        request(options, function(error, response, body) {
            if (error) return callback(Error(error), null);
            return callback(null, body)
        });
    };

    return engines;

}
