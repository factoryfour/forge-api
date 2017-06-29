/**
 * Script to run parameter modification for multiple parts.
 */

const fs = require('fs');
const http = require('https');

const STL_URL = 'https://inventorio-prod.s3-us-west-2.amazonaws.com/aces-workitem-outputs/c0b73363368043ee82206b8cb9054ea2/Output.stl?AWSAccessKeyId=ASIAIB665AIQKVEDAVMA&Expires=1498831876&x-amz-security-token=FQoDYXdzEHYaDDwoFGB4TefLZpLpcyK3A4oIbQQXG06HXyzHFvMGj5qDWbjM7yFi8u9FjfgAmJxqHv9Yt65dUkOwFSVwMdrueHRhFi2KP65jjsspJeJ%2Bel%2FBZWtkq4J%2Bc9HMXH0%2Bz1yw0XEuSTzbfO%2FM83gRwI5grR%2FVHhComdeQwoEp9gSVOqN3%2FG4fkotgGVsXqOz3JnXz2JHNbmUleBjyNMCCWmjf1fIT%2B1ZFCviyAEzL87gzvtqw5ncZq%2BbaYEYY7c0ROm7WqIF0TpPkV0pmmeQ0ssP3VLROGmlXMctffUNTtETHpU3NOwilTqRVpRJD1gt3NSVWfk36h%2FsigtkW%2BnvUvx1GirnphzRfEg%2FHB2MPHiy3VniE9Mq4NAP2Rovlsvv91z2vla%2Fb1ob%2BSpL3BpXZ5dBuAN2xyaOpR%2FkjWt2q1kk1CvUE9UfLrdqTGO6EYtIqoPGEoumRWz232V%2B3r8VoJ%2BdMyAz9gMQpm8LyXb2Hwj5nF1ztOraL4gXyDea8UlL2sHiucOGHoIl6Az1B10O6QYv0llXzUX1FeqVADoWx9atWXX4BtbNqZP2lPzwMzUkPM%2BqRxmHbrv9IavaxclKr1ql0w4%2F6mHB9f7ko8%2FXTygU%3D&Signature=XKnWFUKXf8mdFGrOiluqukTk%2FEg%3D'

const outfile = 'testfile';

// Download the STL? Valid URL?
const stlFile = fs.createWriteStream(`stl/${outfile}.stl`);
console.log(STL_URL);
http.get(STL_URL, function (data) {
	data.pipe(stlFile);
	stlFile.on('finish', function () {
		stlFile.close();
		console.log(`\n${outfile} : STL written to file: ${outfile}.stl`);
	});
});