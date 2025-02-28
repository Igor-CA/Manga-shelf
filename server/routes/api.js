const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const userController = require("../controllers/user");
const Notifications = require("../controllers/notifications");
const { requireAuth } = require("../middlewares/authentications");
//User page api
router.get("/user/logged-user", requireAuth, userController.getLoggedUser);
router.get("/user/:username", userController.getUserCollection);
router.get("/user/:username/missing", userController.getMissingPage);
router.get("/user/stats/:username", userController.getUserStats);
router.get("/user-notifications", Notifications.getUserNotifications);
router.get("/search-user/", userController.searchUser);
router.get("/get-user-info/:username", userController.getUserInfo);
router.get("/get-user-socials/following/:username", userController.getFollowing);
router.get("/get-user-socials/followers/:username", userController.getFollowers);
//Collection page api
router.get("/browse", seriesController.browse);
router.get("/series/:id", seriesController.getSeriesDetails);

//Volumes api
router.get("/volume/:id", volumesController.getVolumeDetails);

module.exports = router;
