module.exports = function(config) {
    console.log(config);
    var authentication = {};




    authentication.test = function() {
        console.log("testing in test " + config);

    };

    return authentication;

}
