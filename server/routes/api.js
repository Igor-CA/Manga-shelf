const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");

//User page api
router.get("/user/:id", function () {});
router.get("/user/:id/collection", function () {});
router.get("/user/:id/missing", function () {});

//Collection page api
router.get("/series/:id", seriesController.getSeriesDetails);
router.get("/search", seriesController.searchSeries);

//Volumes api
router.get("/volume/:id", volumesController.getVolumeDetails);

module.exports = router;
