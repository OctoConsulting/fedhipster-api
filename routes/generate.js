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

//********************************************************************

/* POST generate. */
router.post('/', function(req, res, next) {

	
	//********************************************************************

	console.log('req.body : '+ req.body);

	let config = req.body;

	console.log('config : '+ config);

	//********************************************************************

	async function createFile(config) {

	    console.log('createFile start');

	    let folderName = Math.floor(Math.random() * (999999 - 100000) + 100000);
	    console.log('folderName : '+ folderName);

	    let appName = config['generator-jhipster'].baseName.replace(/[^\w]/gi, '');
	    console.log('appName : '+ appName);
	  
	    try {
	        await fsp.mkdir('./tmp/'+ folderName, { recursive: true });
	        await fsp.mkdir('./tmp/zip/'+ folderName, { recursive: true });
	        await fsp.writeFile('./tmp/'+ folderName +'/.yo-rc.json', JSON.stringify(config)); 
	        
	        console.log('createFile done');

	        createApp(folderName, appName);
	        //zipApp(folderName, appName);
	    } 
	    catch(err) {
	        console.error('Error : ', err);
	        errorHandler (err, req, res, next);
	    }
	};

	//********************************************************************

	function createApp(folderName, appName) {

	    console.log('folderName : '+ folderName);
	    console.log('appName : '+ appName);

	    let cmd = '(cd ./tmp/'+ folderName +' && jhipster app '+ appName +' --force-insight --skip-checks --skip-install --skip-cache --skip-git)';
	    console.log('cmd : '+ cmd);

	    let child = spawn(cmd, { shell: true });

	    child.stdout.on('data', function (data) {
	        console.log('stdout: ' + data.toString());
	    });

	    child.stderr.on('data', function (data) {
	        console.log('stderr: ' + data.toString());
	    });

	    child.on('exit', function (code) {
	        console.log('child process exited with code ' + code.toString());

	        zipApp(folderName, appName);
	    });

	    console.log('createApp done');
	};

	//********************************************************************

	function zipApp(folderName, appName) {

	    console.log('zipApp start');

	    let output = fs.createWriteStream('./tmp/zip/'+ folderName +'/'+ appName +'.zip');

	    let archive = archiver('zip', {
	        zlib: { level: 9 }
	    });

	    archive.on('error', function(err){
	        throw err;
	        errorHandler (err, req, res, next);
	    });

	    archive.pipe(output);
	    archive.directory('./tmp/'+ folderName, appName);
	    archive.finalize();

	    output.on('close', function () {
	        console.log(archive.pointer() + ' total bytes zipped');
	        console.log('archiver has been finalized and the output file descriptor has closed');
	       
	        uploadFile(folderName, appName); 
	    });
	};

	//********************************************************************

	function uploadFile(folderName, appName) {

	    console.log('uploadFile start');

	    let keyName = folderName +'/'+ appName +'.zip';
	    console.log('keyName : '+ keyName);

	    fs.readFile('./tmp/zip/'+ folderName +'/'+ appName +'.zip', (err, data) => {
	        if (err) throw err;

	        const params = {
	            Bucket: 'fedhipster', 
	            Key: keyName, 
	            ACL:'public-read',
	            Body: data
	        };

	        s3.upload(params, function(err, data) {
	            if (err) {
	                console.log(err);
	                errorHandler (err, req, res, next);
	            } else {
	                console.log('Successfully uploaded data : '+ keyName );
	                deleteFolder(folderName, appName);
	            }
	        });
	    });
	};

	//********************************************************************

	async function deleteFolder(folderName, appName) {

	    console.log('deleteFolder start');
	  
	    try {
	        const deletedFolder = await del(['tmp/'+ folderName +'/**', '!tmp']);
	        //console.log('Deleted files and folders : ', deletedFolder.join('\n'));

	        const deletedZip = await del(['tmp/zip/'+ folderName +'/**', '!tmp']);
	        console.log('Deleted zip : ', deletedZip.join('\n'));

	        response(folderName, appName);
	    } 
	    catch(err) {
	        console.error('Error : ', err);
	        errorHandler (err, req, res, next);
	    }
	};

	//********************************************************************
	
	function response(folderName, appName) {

		console.log('response start');

		let url = req.protocol + '://' + req.get('host') +'/api/files/'+ folderName +'/'+ appName +'.zip';
		console.log('url : '+ url);

		let resJSON = {
			'status': 200,
			'success': true,
			'folder': folderName,
			'app': appName,
			'url': url,
			'config': config
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

	createFile(config);

	//********************************************************************

  	
});

module.exports = router;
