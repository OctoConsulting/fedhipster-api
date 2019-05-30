var express = require('express');
var router = express.Router();

//********************************************************************

require('dotenv').config();

const archiver = require('archiver');

const fs = require('fs');
const fsp = fs.promises;

const del = require('del');

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const { spawn } = require('child_process');

const Client = require('ssh2').Client;

//********************************************************************

/* POST generate. */
router.get('/', function(req, res, next) {

	console.log('click router ' );

	
	//********************************************************************

	async function click(filePath) {

		console.log('click  ' );
		console.log('filePath : '+ filePath );
	    var tempFileName = './'+filePath;
	    console.log('tempFileName : '+ tempFileName );
	    
	 
	    var conn = new Client();
	    conn.on('ready', function() {
	      console.log('Client :: ready');
	      conn.exec('pwd && uptime && oc login -u admin && pwd && cd downloads/openshift-cd-demo/scripts && pwd && ./provision.sh deploy --enable-che --ephemeral && pwd && oc start-build tasks-pipeline && pwd', function(err, stream) {
	        if (err) throw err;
	        stream.on('close', function(code, signal) {
	          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
	          conn.end();

	          var out = 'Stream :: close :: code: ' + code + ', signal: ' + signal;

	          response(out);

	        }).on('data', function(data) {
	          console.log('STDOUT: ' + data);
	        }).stderr.on('data', function(data) {
	          console.log('STDERR: ' + data);
	        });
	      });
	    }).connect({
	      host: '18.188.13.180',
	      port: 22,
	      username: 'ec2-user',
	      privateKey: require('fs').readFileSync(tempFileName)
	    });
    }

    //********************************************************************

    function getKey() {

	    console.log('uploadFile start');

	    var params = {
	        Bucket: 'one-click-secure',
	        Key: 'key.pem'
	    }

	    var filePath = 'tmp/key.pem';

	    s3.getObject(params, (err, data) => {
	        if (err) console.error(err)
	        fs.writeFileSync(filePath, data.Body.toString())
	        console.log(`${filePath} has been created!`);
	        click(filePath);
	    })
	};

	//********************************************************************
	
	function response(out) {

		console.log('response start');


		let resJSON = {
			'status': 200,
			'success': true,
			'out': out
		};

		res.json(resJSON);
	}

	//********************************************************************

	function errorHandler (err, req, res, next) {

		console.log('errorHandler');

		if (res.headersSent) {
			return next(err);
		}
		res.status(500);
		res.render('error', { error: err });
	}


	//********************************************************************

	getKey();

	//********************************************************************

  	
});

module.exports = router;
