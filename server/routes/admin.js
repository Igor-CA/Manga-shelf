const express = require('express');
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes")

router.get('/', seriesController.all);
router.get('/search', seriesController.searchSeries)
router.get('/volumes', volumesController.all);

module.exports = router;