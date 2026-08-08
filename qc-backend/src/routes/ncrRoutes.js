const express = require("express");
const router = express.Router();
const { list, update } = require("../controllers/ncrController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, list);            // GET /api/ncr?status=open
router.put("/:lotId", requireAuth, update);    // PUT /api/ncr/:lotId

module.exports = router;
