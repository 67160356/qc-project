const express = require("express");
const router = express.Router();
const { register, login, logout, changePassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// เส้นทางตามโจทย์: POST /register, /login, /logout, /change-password
router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.post("/change-password", requireAuth, changePassword);

module.exports = router;
