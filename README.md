# Forge Inventor Wrapper

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
