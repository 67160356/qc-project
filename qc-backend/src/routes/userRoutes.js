const express = require("express");
const router = express.Router();
const { getMe, getById, list, update, remove, checkUsername } = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");

// เส้นทางตามโจทย์: GET /me, /users/{id}, /users, PUT /users/{id}, DELETE /users/{id}, GET /check-username/{name}
router.get("/check-username/:name", checkUsername); // public
router.get("/me", requireAuth, getMe);
router.get("/users", requireAuth, list);
router.get("/users/:id", requireAuth, getById);
router.put("/users/:id", requireAuth, update);
router.delete("/users/:id", requireAuth, remove);

module.exports = router;
