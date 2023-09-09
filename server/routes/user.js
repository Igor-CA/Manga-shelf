const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/forgot", userController.sendResetEmail);
router.post("/reset-password", userController.resetPassword);
router.post("/add-series", userController.addSeries);
router.post("/add-volume", userController.addVolume);
router.post("/remove-series", userController.removeSeries);
router.post("/remove-volume", userController.removeVolume);
module.exports = router;
