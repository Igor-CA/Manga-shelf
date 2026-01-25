const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const submissionController = require("../controllers/submission");

router.post("/volume/delete", volumesController.deleteVolumeAndNotify);
router.post("/series/delete", seriesController.deleteSeriesAndNotify);
router.get("/submissions", submissionController.getPendingSubmissions)
router.post("/submission/approve/:id", submissionController.approveSubmission)
router.post("/submission/reject/:id", submissionController.rejectSubmission)

module.exports = router;
