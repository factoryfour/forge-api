/* File to generate pre-signed s3 url based upon methods */

const aws = require('aws-sdk');

const s3 = new aws.S3({
	signatureVersion: 'v4',
	region: 'us-east-1'
});

const s3UrlFactory = (req, callback) => {
	const { Key, Bucket } = req.s3;
	const params = {
		Key,
		Bucket
	};
	if (req.method == 'PUT') {
	} else if (req.method == 'GET') {
		Object.assign(params, {
			ResponseContentDisposition: `attachment; filename="${Key}"`
		});
	}
	return s3.getSignedUrl(
		`${req.method.toLowerCase()}Object`,
		params,
		(err, url) => callback(err, url)
	);
};

module.exports = s3UrlFactory;
