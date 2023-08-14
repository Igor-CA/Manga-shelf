const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");

router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/add", userController.addSeries);
router.post("/remove", userController.removeSeries);
router.post("/add-volume", userController.addVolume);
router.post("/remove-volume", userController.removeVolume);
router.get("/profile", userController.getProfilePage);
module.exports = router;
