const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");

router.post("/volume/delete", volumesController.deleteVolumeAndNotify);
router.post("/series/delete", seriesController.deleteSeriesAndNotify);

module.exports = router;
