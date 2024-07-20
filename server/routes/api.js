const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const userController = require("../controllers/user")

//User page api
router.get("/user/logged-user", userController.getLoggedUser);
router.get("/user/:username", userController.getUserCollection);
router.get("/user/:username/missing", userController.getMissingPage);

//Collection page api
router.get("/browse", seriesController.browse);
router.get("/series/:id", seriesController.getSeriesDetails);

//Volumes api
router.get("/volume/:id", volumesController.getVolumeDetails);

module.exports = router;
