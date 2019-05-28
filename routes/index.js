var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

	let rndImg = Math.floor(Math.random() * (4 - 0) + 0);
	let rndFont = Math.floor(Math.random() * (7 - 0) + 0);

	res.render('index', { title: 'Welcome FedHipster', numImg: rndImg, classFont: rndFont});
});

module.exports = router;
