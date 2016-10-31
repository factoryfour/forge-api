var request = require('request');

module.exports = function(config) {
    var da = {};

    da.engines = require('./design_automation/engines.js'); 

    return da;

}
