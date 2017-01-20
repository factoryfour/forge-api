var os = require('os');

function do_the_thing(callback) {

  // Check platform to handle file path issues
  var isWin = os.platform().indexOf('win') > -1
  if (isWin) {
    var root = __dirname.substring(0, __dirname.lastIndexOf('\\'));
  }
  else {
    var root = __dirname.substring(0, __dirname.lastIndexOf('/'));
  }
  // Initialize Forge interface
  const config = require(__dirname + "/get_config.js")(root + '/config.js');
  const forge = require(root + '/index.js');
  const auth = forge.auth(config);

  var workItemConfig = {
    Arguments: {
      InputArguments: [{
        Resource: "https://s3-us-west-2.amazonaws.com/inventor-io-samples/Box.ipt",
        Name: "HostDwg",
        StorageProvider: "Generic"
      }, {
        Resource:  'data:application/json,{\"d2\":\"0.5 in\", \"d3\":\"0.2 in\"}',
        Name: 'ChangeParameters',
        StorageProvider: 'Generic'
      }],
      OutputArguments: [{
        Name : "Result",
        StorageProvider : "Generic",
        HttpVerb : "POST"
      }]
    },
    ActivityId: "SampleActivity",
    Id: ""
  }

  var scope = ['data:read', 'bucket:read', 'code:all']

  auth.two_leg(scope, function(error, cAuthObj) {
    if (error) {
      throw error;
    }
    var authObj = cAuthObj;
    // Set up design automation with auth object
    var da = forge.da(config, authObj);
    da.work_items.get('39a054ad17a44aad9fcabba3ba1dc53e', function(error, response) {
      if (error) return callback(error, response)
      else {
        return callback(error, response)
      }
    })
  });

}

// =============================================================================

do_the_thing(function(error, response) {
  if (error) console.log(error);
  else {
    console.log(response);
    // console.log(resonse.value.length);
  }
})
