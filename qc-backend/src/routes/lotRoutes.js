const express = require("express");
const router = express.Router();
const {
  list, create, getById, submitIncoming, addSpcReading, submitFinal, submitDecision,
} = require("../controllers/lotController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, list);                          // GET  /api/lots?stage=&line=
router.post("/", requireAuth, create);                        // POST /api/lots
router.get("/:id", requireAuth, getById);                     // GET  /api/lots/:id
router.post("/:id/incoming", requireAuth, submitIncoming);    // POST /api/lots/:id/incoming
router.post("/:id/spc-readings", requireAuth, addSpcReading); // POST /api/lots/:id/spc-readings
router.post("/:id/final", requireAuth, submitFinal);          // POST /api/lots/:id/final
router.post("/:id/decision", requireAuth, submitDecision);    // POST /api/lots/:id/decision

module.exports = router;
