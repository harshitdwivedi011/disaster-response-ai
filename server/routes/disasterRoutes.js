const express = require("express");
const router = express.Router();
const {
  createDisaster,
  getDisasters,
  updateDisaster,
  deleteDisaster,
  getSocialMedia,
  getResourcesNearby,
  getOfficialUpdates,
  verifyImage,
} = require("../controllers/disasterController");

router.post("/", createDisaster);
router.get("/", getDisasters);
router.put("/:id", updateDisaster);
router.delete("/:id", deleteDisaster);

router.get("/:id/social-media", getSocialMedia);
router.get("/:id/resources", getResourcesNearby);
router.get("/official-updates", getOfficialUpdates);
router.post("/:id/verify-image", verifyImage);

module.exports = router;
