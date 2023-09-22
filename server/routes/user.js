const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const reportController = require("../controllers/report");

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.get("/logout", userController.logout);
router.post("/forgot", userController.sendResetEmail);
router.post("/reset-password", userController.resetPassword);
router.post("/report", reportController.createReport);
router.post("/add-series", userController.addSeries);
router.post("/add-volume", userController.addVolume);
router.post("/remove-series", userController.removeSeries);
router.post("/remove-volume", userController.removeVolume);
module.exports = router;
