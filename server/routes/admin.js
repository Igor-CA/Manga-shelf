var express = require('express');
var router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes")

router.get('/', seriesController.all);
router.get('/volumes', volumesController.all);

module.exports = router;