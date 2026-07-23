const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../middlewares/uploadMiddleware");

const uploadImage = (req, res, next) => {
	upload.single("image")(req, res, (err) => {
		if (err) {
			const msg =
				err.code === "LIMIT_FILE_SIZE"
					? "A imagem excede o tamanho máximo permitido."
					: err.message || "Erro ao enviar a imagem.";
			return res.status(400).json({ msg });
		}
		next();
	});
};

const {
	authController,
	profileController,
	userActionsController,
} = require("../controllers/user/index");

const reportController = require("../controllers/report");
const notificationsController = require("../controllers/notifications");
const collectionPhotosController = require("../controllers/collectionPhotos");
const submissionController = require("../controllers/submission");
const postController = require("../controllers/post");
const postReportController = require("../controllers/postReport");
const ratingController = require("../controllers/rating");
const { requireAuth } = require("../middlewares/authentications");
const { createAuthLimiter } = require("../middlewares/rateLimiters");
const {
	signupValidation,
	loginValidation,
	resetPasswordValidator,
	forgotPasswordValidation,
	validateRequest,
	changeUsernameValidator,
	changePasswordValidator,
	changeEmailValidator,
	reportsValidation,
	editOwnedValidation,
	photoValidation,
	submissionValidation,
	postValidation,
	reportValidation,
	ratingValidation,
	ratingDeleteValidation,
	collectionVolumeValidation,
	bodyIdValidation,
	readStatusValidation,
	markNotificationSeenValidation,
} = require("../middlewares/validators");

//Authentication related functions
router.post(
	"/signup",
	createAuthLimiter(),
	signupValidation,
	validateRequest,
	authController.signup,
);
router.post(
	"/login",
	createAuthLimiter(),
	loginValidation,
	validateRequest,
	authController.login,
);
router.post("/logout", requireAuth, authController.logout);
router.get(
	"/login/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
	"/auth/google/callback",
	passport.authenticate("google", { failureRedirect: "/login" }),
	(req, res) => {
		res.redirect("/");
	},
);

router.post(
	"/forgot",
	createAuthLimiter(),
	forgotPasswordValidation,
	validateRequest,
	authController.sendResetEmail,
);

router.post(
	"/reset-password",
	createAuthLimiter(),
	resetPasswordValidator,
	validateRequest,
	authController.resetPassword,
);
router.post(
	"/report",
	reportsValidation,
	validateRequest,
	reportController.createReport,
);

//
router.post(
	"/add-series",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.addSeries,
);
router.post(
	"/add-to-wishlist",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.addToWishlist,
);
router.post(
	"/add-volume",
	requireAuth,
	collectionVolumeValidation,
	validateRequest,
	userActionsController.addVolume,
);
router.post(
	"/remove-series",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.removeSeries,
);
router.post(
	"/remove-from-wishlist",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.removeFromWishList,
);
router.post(
	"/remove-volume",
	requireAuth,
	collectionVolumeValidation,
	validateRequest,
	userActionsController.removeVolume,
);
router.post(
	"/drop-series",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.dropSeries,
);
router.post(
	"/undrop-series",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.undropSeries,
);
router.post(
	"/toggle-read",
	requireAuth,
	bodyIdValidation,
	validateRequest,
	userActionsController.toggleVolumeRead,
);
router.post(
	"/set-read-status",
	requireAuth,
	readStatusValidation,
	validateRequest,
	userActionsController.setVolumesReadStatus,
);
router.put(
	"/edit-owned-volumes",
	requireAuth,
	editOwnedValidation,
	validateRequest,
	userActionsController.editOwnedVolumes,
);
router.put(
	"/set-username",
	requireAuth,
	changeUsernameValidator,
	validateRequest,
	profileController.setUserName,
);
router.put(
	"/change-profile-pic",
	requireAuth,
	profileController.changeProfilePicture,
);
router.put(
	"/change-profile-banner",
	requireAuth,
	profileController.changeProfileBanner,
);
router.put(
	"/change-password",
	requireAuth,
	changePasswordValidator,
	validateRequest,
	profileController.changePassword,
);
router.put(
	"/change-email",
	requireAuth,
	changeEmailValidator,
	validateRequest,
	profileController.changeEmail,
);
router.put("/allow-adult", requireAuth, profileController.allowAdultContent);
router.put(
	"/toggle-follow",
	requireAuth,
	userActionsController.toggleFollowUser,
);
router.put(
	"/set-notifications",
	requireAuth,
	profileController.setUserNotifications,
);
router.put(
	"/mark-notification-seen",
	requireAuth,
	markNotificationSeenValidation,
	validateRequest,
	notificationsController.setNotificationAsSeen,
);
router.put(
	"/mark-all-notifications-seen",
	requireAuth,
	notificationsController.setAllNotificationsAsSeen,
);

// Ratings
router.post(
	"/rating",
	requireAuth,
	ratingValidation,
	validateRequest,
	ratingController.upsertRating,
);
router.delete(
	"/rating",
	requireAuth,
	ratingDeleteValidation,
	validateRequest,
	ratingController.removeRating,
);

// Posts (comments)
router.post(
	"/post",
	requireAuth,
	uploadImage,
	postValidation,
	validateRequest,
	postController.createPost,
);
router.patch(
	"/post/:id",
	requireAuth,
	uploadImage,
	postValidation,
	validateRequest,
	postController.editPost,
);
router.delete("/post/:id", requireAuth, postController.deletePost);
router.post("/post/:id/like", requireAuth, postController.likePost);
router.delete("/post/:id/like", requireAuth, postController.unlikePost);
router.post(
	"/post/:id/report",
	requireAuth,
	reportValidation,
	validateRequest,
	postReportController.createReport,
);

// Collection photos routes
router.post(
	"/collection-photos",
	requireAuth,
	photoValidation,
	validateRequest,
	collectionPhotosController.createPhoto,
);
router.get(
	"/:username/collection-photos",
	collectionPhotosController.getUserPhotos,
);
router.get("/collection-photos/:id", collectionPhotosController.getPhoto);
router.put(
	"/collection-photos/:id",
	requireAuth,
	photoValidation,
	validateRequest,
	collectionPhotosController.updatePhoto,
);
router.delete(
	"/collection-photos/:id",
	requireAuth,
	collectionPhotosController.deletePhoto,
);

// Submissions
const parseSubmissionBody = (req, res, next) => {
	if (req.body.payload && typeof req.body.payload === "string") {
		try {
			req.body.payload = JSON.parse(req.body.payload);
		} catch (error) {
			req.body.payload = null;
		}
	}
	next();
};
router.post(
	"/submission",
	requireAuth,
	upload.single("file"),
	parseSubmissionBody,
	submissionValidation,
	validateRequest,
	submissionController.createSubmission,
);

router.get("/:username/submission", submissionController.getUserSubmissions);
module.exports = router;
