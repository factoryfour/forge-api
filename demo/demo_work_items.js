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
        StorageProvider: 'Generic',
        ResourceKind: 'Embedded'
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
  // Get the auth token
  auth.two_leg(scope, function(error, cAuthObj) {
    if (error) {
      throw error;
    }
    var authObj = cAuthObj;
    // Set up design automation with auth object
    var da = forge.da(config, authObj);

    // da.activities.get("SampleActivity", function(error, response) {
    //   console.log(error);
    //   console.log(response.Parameters);
    // })

    // Create a work item
    da.work_items.create(workItemConfig, function(error, response) {
      if (error) return callback(error, response)
      else {
        var responseId = response.Id;
        var intervalObject = setInterval(function() {
          da.work_items.get(responseId, function(error, response) {
            if (error) {
              clearInterval(intervalObject)
              return callback(error, response)
            }
            else if (!(response.Status == 'Pending' || response.Status == 'InProgress')) {
              // console.log(response);
              clearInterval(intervalObject)
              return callback(error, response)
            }
            else {
              console.log(response.Status);
            }
          })

        }, 1000); // Check every 2 seconds
      }
    })
  });

}

// =============================================================================

do_the_thing(function(error, response) {
  if (error) console.log(error);
  else {
    console.log(response);
    // console.log(response.value.length);
  }
})
