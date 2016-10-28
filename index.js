module.exports = function(config) {
    var forge = {};

    forge.auth = require('./resources/auth.js')(config);

    return forge;
};
