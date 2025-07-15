const express = require("express");
const router = express.Router();
const passport = require("passport");

const userController = require("../controllers/user");
const { authController, profileController, userActionsController } = require("../controllers/user/index");

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
	changePasswordValidator,
	changeEmailValidator,
	reportsValidation,
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
router.post("/report", reportsValidation, validateRequest, reportController.createReport);

//
router.post("/add-series", requireAuth, userActionsController.addSeries);
router.post("/add-to-wishlist", requireAuth, userActionsController.addToWishlist);
router.post("/add-volume", requireAuth, userActionsController.addVolume);
router.post("/remove-series", requireAuth, userActionsController.removeSeries);
router.post("/remove-from-wishlist", requireAuth, userActionsController.removeFromWishList);
router.post("/remove-volume", requireAuth, userActionsController.removeVolume);
router.post("/drop-series", requireAuth, userActionsController.dropSeries);
router.post("/undrop-series", requireAuth, userActionsController.undropSeries);
router.put(
	"/set-username",
	requireAuth,
	changeUsernameValidator,
	validateRequest,
	profileController.setUserName
);
router.put(
	"/change-profile-pic",
	requireAuth,
	profileController.changeProfilePicture
);
router.put(
	"/change-profile-banner",
	requireAuth,
	profileController.changeProfileBanner
);
router.put(
	"/change-password",
	requireAuth,
	changePasswordValidator,
	validateRequest,
	profileController.changePassword
);
router.put(
	"/change-email",
	requireAuth,
	changeEmailValidator,
	validateRequest,
	profileController.changeEmail
);
router.put("/allow-adult", requireAuth, profileController.allowAdultContent);
router.put("/toggle-follow", requireAuth, userActionsController.toggleFollowUser);
router.put(
	"/set-notifications",
	requireAuth,
	profileController.setUserNotifications
);
router.put(
	"/mark-notification-seen",
	requireAuth,
	notificationsController.setNotificationAsSeen
);

module.exports = router;
