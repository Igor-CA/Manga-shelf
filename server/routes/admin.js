const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const Series = require("../models/Series");
const volume = require("../models/volume");

router.get("/", seriesController.browse);
router.get("/volumes", volumesController.all);

module.exports = router;
