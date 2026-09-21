const express = require("express");
const router = express.Router();

const seriesController = require("../controllers/series");
const volumesController = require("../controllers/volumes");
const submissionController = require("../controllers/submission");
const notificationController = require("../controllers/notifications");
const postReportController = require("../controllers/postReport");
const linksController = require("../controllers/links");

router.post("/volume/delete", volumesController.deleteVolumeAndNotify);
router.post("/series/delete", seriesController.deleteSeriesAndNotify);
router.get("/submissions", submissionController.getPendingSubmissions)
router.post("/submission/approve/:id", submissionController.approveSubmission)
router.post("/submission/reject/:id", submissionController.rejectSubmission)
router.post("/add-patch-note", notificationController.adminSendPatchNotes)
router.get("/reports", postReportController.getPendingReports)
router.post("/report/:id/delete-post", postReportController.deleteReportedPost)
router.post("/report/:id/restore", postReportController.restoreReportedPost)
router.get("/link-providers", linksController.listProviders)
router.post("/link-providers", linksController.createProvider)
router.put("/link-providers/:id", linksController.updateProvider)

module.exports = router;
