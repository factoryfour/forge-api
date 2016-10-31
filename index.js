module.exports = function(config) {
    var forge = {};

    forge.auth = require('./resources/auth.js')(config);
    forge.design_automation = require('./resources/design_automation.js')(config);

    return forge;
};
