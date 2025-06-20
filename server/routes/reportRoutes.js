const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/", reportController.getReports);
router.post("/", reportController.createReport);
router.patch("/:id/update-verification", reportController.updateVerificationStatus);

module.exports = router;
