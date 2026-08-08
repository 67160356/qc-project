const express = require("express");
const router = express.Router();
const { summary } = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, summary); // GET /api/dashboard

module.exports = router;
