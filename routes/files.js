var express = require('express');
var router = express.Router();

/* GET files. */
router.get('/:folderID/:fileID', function(req, res, next) {

	console.log('req.params : '+ req.params);

	res.redirect('https://s3.amazonaws.com/fedhipster/'+ req.params.folderID +'/'+ req.params.fileID);
  	//res.send(req.params)
});

module.exports = router;
