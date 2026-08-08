const express = require("express");
const router = express.Router();
const { list, getBySku } = require("../controllers/specController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, list);          // GET /api/specs
router.get("/:sku", requireAuth, getBySku);  // GET /api/specs/:sku

module.exports = router;
