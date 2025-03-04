const express = require("express");
const router = express.Router();
const passport = require("passport");

const userController = require("../controllers/user");
const { authController } = require("../controllers/user/index");

const reportController = require("../controllers/report");
const notificationsController = require("../controllers/notifications");
const { requireAuth } = require("../middlewares/authentications");
const {
	signupValidation,
	loginValidation,
	newPasswordValidator,
	forgotPasswordValidation,
	validateRequest,
	changeUsernameValidator,
} = require("../middlewares/validators");

//Authentication related functions
router.post(
	"/signup",
	signupValidation,
	validateRequest,
	authController.signup
);
router.post("/login", loginValidation, validateRequest, authController.login);
router.get("/logout", requireAuth, authController.logout);
router.get(
	"/login/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
	"/auth/google/callback",
	passport.authenticate("google", { failureRedirect: "/login" }),
	(req, res) => {
		res.redirect("/");
	}
);

router.post(
	"/forgot",
	forgotPasswordValidation,
	validateRequest,
	authController.sendResetEmail
);

router.post(
	"/reset-password",
	newPasswordValidator,
	validateRequest,
	authController.resetPassword
);
router.post("/report", reportController.createReport);

//
router.post("/add-series", requireAuth, userController.addSeries);
router.post("/add-volume", requireAuth, userController.addVolume);
router.post("/remove-series", requireAuth, userController.removeSeries);
router.post("/remove-volume", requireAuth, userController.removeVolume);
router.put("/set-username", requireAuth, changeUsernameValidator,validateRequest, userController.setUserName);
router.put(
	"/change-profile-pic",
	requireAuth,
	userController.changeProfilePicture
);
router.put(
	"/change-profile-banner",
	requireAuth,
	userController.changeProfileBanner
);
router.put("/change-password", requireAuth, userController.changePassword);
router.put("/allow-adult", requireAuth, userController.allowAdultContent);
router.put("/change-email", requireAuth, userController.changeEmail);
router.put("/follow", requireAuth, userController.followUser);
router.put("/unfollow", requireAuth, userController.unfollowUser);
router.put(
	"/set-notifications",
	requireAuth,
	userController.setUserNotifications
);
router.put(
	"/mark-notification-seen",
	requireAuth,
	notificationsController.setNotificationAsSeen
);

module.exports = router;
