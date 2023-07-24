var express = require('express');
var router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes")

//User page api
router.get('/user/:id', function(){});
router.get('/user/:id/collection', function(){});
router.get('/user/:id/missing', function(){});

//Collection page api
router.get('/series/:id',  seriesController.getSeriesDetails);

//Volumes api
router.get('/volume/:id',  volumesController.getVolumeDetails);

module.exports = router;