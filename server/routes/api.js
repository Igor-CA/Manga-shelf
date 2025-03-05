const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const userController = require("../controllers/user");
const Notifications = require("../controllers/notifications");
const { requireAuth } = require("../middlewares/authentications");
const { authController } = require("../controllers/user/index");

//User page api
router.get("/user/logged-user", requireAuth, authController.getLoggedUser);
router.get("/user/:username", userController.getUserCollection);
router.get("/user/:username/missing", userController.getMissingPage);
router.get("/user/stats/:username", userController.getUserStats);
router.get("/user-notifications", Notifications.getUserNotifications);
router.get("/search-user/", userController.searchUser);
router.get("/get-user-info/:username", userController.getUserInfo);
router.get("/get-user-socials/:type/:username", userController.getSocials); //Type can be followers/following
//Collection page api
router.get("/browse", seriesController.browse);
router.get("/series/:id", seriesController.getSeriesDetails);

//Volumes api
router.get("/volume/:id", volumesController.getVolumeDetails);

module.exports = router;
