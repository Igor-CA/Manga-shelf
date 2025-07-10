const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const Notifications = require("../controllers/notifications");
const { requireAuth } = require("../middlewares/authentications");
const { authController, userInfoController } = require("../controllers/user/index");

//User page api
router.get("/user/logged-user", requireAuth, authController.getLoggedUser);
router.get("/user/:username", userInfoController.getUserCollection);
router.get("/user/:username/missing", userInfoController.getMissingPage);
router.get("/user/:username/wishlist", userInfoController.getUserWishlist);
router.get("/user/stats/:username", userInfoController.getUserStats);
router.get("/user-notifications", Notifications.getUserNotifications);
router.get("/search-user/", userInfoController.searchUser);
router.get("/get-user-info/:username", userInfoController.getUserInfo);
router.get("/get-user-socials/:type/:username", userInfoController.getSocials); //Type can be followers/following
//Collection page api
router.get("/browse", seriesController.browse);
router.get("/series/:id", seriesController.getSeriesDetails);

//Volumes api
router.get("/volume/:id", volumesController.getVolumeDetails);

module.exports = router;
