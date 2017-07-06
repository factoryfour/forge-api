# Using the PQ Glasses STL Generator

more to come...

# Forge Inventor Wrapper

[![Build Status](https://travis-ci.com/fusiform/forge-inventor.svg?token=tHkUZCpHbCAJ8x8CetyS&branch=master)](https://travis-ci.com/fusiform/forge-inventor)

This package is intended to be a NodeJS Forge API wrapper. Currently it focuses on features required for running design automation jobs.

#### Using Forge Inventor
```javascript
	npm install forge-inventor
	const forge = require('forge-inventor');
```  

#### Running tests

```javascript
	npm test
```
For detailed testing output, set VERBOSE=loud as an environment variable.

## Configuration Object

For ease of use the config object is passed to various components of the API.
```javascript
module.exports = {
    "CLIENT_ID" : "********************************",
    "CLIENT_SECRET": "****************",
    "DA_BASE_URL": "https://developer.api.autodesk.com/xxxxxxxxxx.io/xx-xxxx/xx/"
};
```
DA_BASE_URL is the value used as the base for all API calls to design automation.

## Authentication

Forge API uses OAuth for authentication, however these tokens expire in ~24 hours. This authentication package provides a seamless way to maintain an authenticated state with just a CLIENT_ID and CLIENT_SECRET.

With the two_leg method, Authentication will perform a request for a valid token. The Authentication Object has one method, getToken() which asynchronously will provide this token. If a refresh is upcoming, the Authentication Object will temporarily lock and suspend getToken requests; after refreshing the authentication token, it will resolve getToken calls with a new valid token.

To guarantee a valid key is generated for each request to the Forge API, future methods will require an Authentication Object rather than the token itself.

```javascript
const forge = require('forge-inventor');
const auth = forge.auth(config);

// Set scope for authentication request
var scope = ['data:read', 'bucket:read', 'code:all']

// Generate new authentication object via two_leg pattern
auth.two_leg(scope, function(error, authObj) {
	if (error) {
		throw error;
	}
	// Initialize Design Automation or other Forge API with authObj
	da = forge.da(config, authObj);
	//
	// Continue logic
	//
});
```

## Glasses Design Automation

### Execution
``` 
node change_parameters.js ./sample_parameters.json job_name
```

### Formatting the parameters JSON
The parameters JSON file must contain the following fields:
- Part: URL to download the Inventor part to be modified
- Parameters: JSON object with "parameter_name": value

The value field can either be a number or a value with units, represented as a string (eg: 12 or "12 mm")

Sample parameters file:
``` javascript
{
	"Name": "job_name",
    "Part": "https://static.factoryfour.com/pq/typeF_v12.ipt",
    "Parameters": {
		"FrameID": "FF01",
        "SupLat_w": 65,
        "SupLat_h": 20,
        "SupMed_w": 4,
        "InfLatRoundingWidth": 12,
        "InfLat_h": 21,
        "InfMed_h": 17,
        "SupLatRoundingWidth": 12,
        "InfMedRoundingWidth": 12,
        "PupilDistance": 62
    }
}
```

### Output
When if begins processing...
```
{ '@odata.context': 'https://developer.api.autodesk.com/inventor.io/us-east/v2/$metadata#WorkItems/$entity',
  ActivityId: 'SampleActivity',
  Arguments:
   { InputArguments: [ [Object], [Object] ],
     OutputArguments: [ [Object] ] },
  Status: 'Pending',
  StatusDetails: { Report: null },
  AvailabilityZone: null,
  TimeQueued: '2017-03-29T19:58:30.5044755Z',
  TimeInputTransferStarted: null,
  TimeScriptStarted: null,
  TimeScriptEnded: null,
  TimeOutputTransferEnded: null,
  TimeOutputTransferEnded: null,
  BytesTranferredIn: null,
  BytesTranferredOut: null,
  Timestamp: '0001-01-01T00:00:00Z',
  Id: '673acb4115154e38ad6f272af54ab97d' }
```
The work item has started, now let's check on it...
```
    Pending
    Pending
    .
    .
    .
    Pending
    Pending
```
### When it's finished...

First, print some metadata from Forge
```
===== FINISHED: Output from Forge =====
{ 
    '@odata.context': 'https: //developer.api.autodesk.com/inventor.io/us-east/v2/$metadata#WorkItems/$entity',
    ActivityId: 'SampleActivity',
    Arguments: { InputArguments: [
            [Object],
            [Object]
        ],
     OutputArguments: [
            [Object]
        ]
    },
    Status: 'Succeeded',
    StatusDetails: { 
        Report: 'https: //inventorio-prod.s3-us-west-2.amazonaws.com/aces-workitem-reports/[WORK_ITEM_ID]/report.log?a_bunch_of_other_stuff' 
    },
    AvailabilityZone: null,
    TimeQueued: '2017-03-29T19: 58: 30.504Z',
    TimeInputTransferStarted: '2017-03-29T19: 58: 30.691Z',
    TimeScriptStarted: '2017-03-29T19: 58: 34.242Z',
    TimeScriptEnded: '2017-03-29T19: 59: 09.832Z',
    TimeOutputTransferEnded: '2017-03-29T19: 59: 09.988Z',
    BytesTranferredIn: 3349007,
    BytesTranferredOut: 928684,
    Timestamp: '2017-03-29T19: 59: 10.003Z',
    Id: 'asdfasdfasdfasdfasdfasdfasdf'
}
```

Then, print the link to the report file.
```
===== Process Report URL =====
https://inventorio-prod.s3-us-west-2.amazonaws.com/aces-workitem-reports/[WORK_ITEM_ID]/report.log?[a_bunch_of_other_stuff]
```

Finally, print the link to the modified STL
```
===== OUTPUT STL URL =====
https://inventorio-prod.s3-us-west-2.amazonaws.com/aces-workitem-outputs/[WORK_ITEM_ID]/Output.stl?[a_bunch_of_other_stuff]

```
