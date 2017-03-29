const os = require('os');

function run_work_item(inArgs, callback) {

    // Check platform to handle file path issues
    var isWin = os.platform().indexOf('win32') > -1
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

    // Work item configuration JSON
    var workItemConfig = {
        Arguments: {
            InputArguments: [
                // Specify the input part
                {
                    Resource: inArgs.Part,
                    Name: "HostDwg",
                    StorageProvider: "Generic",
                    HttpVerb: "GET"
                },
                // Change the parameters
                {
                    Resource: 'data:application/json,' + JSON.stringify(inArgs.Parameters),
                    Name: 'ChangeParameters',
                    StorageProvider: 'Generic',
                    ResourceKind: 'Embedded'
                }
            ],
            // Output arguments
            OutputArguments: [
                {
                    Name: "Result",
                    StorageProvider: "Generic",
                    HttpVerb: "POST"
                }
            ]
        },
        ActivityId: "SampleActivity",
        Id: ""
    }

    // Declare scope
    var scope = ['data:read', 'bucket:read', 'code:all']
    // Get the auth token
    auth.two_leg(scope, function (error, cAuthObj) {
        if (error) {
            throw error;
        }
        // Set up design automation with auth object
        var da = forge.da(config, cAuthObj);

        // Create a work item
        da.work_items.create(workItemConfig, function (error, response) {
            // Log results of creating a work item
            console.log(response);
            if (error) {
                console.log("ERROR: CREATING WORK ITEM");
                return callback(error, response)
            }
            else {
                // Save the work item id
                var responseId = response.Id;
                // Check the status of the work item at a fixed interval
                var intervalObject = setInterval(function () {
                    // Poll the work item's status
                    da.work_items.get(responseId, function (error, response) {
                        // Stop if there's an error
                        if (error) {
                            console.log("ERROR: CHECKING STATUS");
                            clearInterval(intervalObject)
                            return callback(error, response)
                        }
                        // If it is finished
                        else if (!(response.Status == 'Pending' || response.Status == 'InProgress')) {
                            clearInterval(intervalObject)
                            return callback(error, response)
                        }
                        // Otherwise, log the status and repeat
                        else {
                            console.log(response.Status);
                        }
                    })

                }, 2000); // Check every 2 seconds
            }
        })
    });

}

// MAIN LOGIC ===================================================================

var args = process.argv.slice(2);
if (args.length < 1) {
    console.log("ERROR: Not enough arguments. Must specify parameters file.")
}
else {
    var params = require(args[0])
    if (!params.Part) {
        console.log("ERROR: Must specify Part field in parameters file.")
    }
    if (!params.Input) {
        console.log("ERROR: Must specify Parameters field in parameters file.")
    }
    else {
        // Run the work item to modify the parameters
        run_work_item(params, function (error, response) {
            if (error) {
                console.log(error);
                console.log(response);
            }
            else {
                console.log('\n===== FINISHED: Output from Forge =====');
                console.log(response);

                console.log('\n===== Process Report URL =====');
                console.log(response.StatusDetails.Report);

                console.log('\n===== Modified STL URL =====');
                console.log(response.Arguments.OutputArguments[0].Resource);
            }
        })
    }
}
