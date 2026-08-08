const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { blacklistToken } = require("../utils/tokenBlacklist");

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password, fullName } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "ต้องระบุ username, email, password" });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: "username นี้ถูกใช้แล้ว" });
    }
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ message: "email นี้ถูกใช้แล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, fullName });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ", error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "ต้องระบุ username และ password" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "username หรือ password ไม่ถูกต้อง" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "username หรือ password ไม่ถูกต้อง" });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "เข้าสู่ระบบไม่สำเร็จ", error: err.message });
  }
}

// POST /api/auth/logout (protected)
async function logout(req, res) {
  blacklistToken(req.token);
  return res.json({ message: "ออกจากระบบสำเร็จ" });
}

// POST /api/auth/change-password (protected)
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "ต้องระบุ oldPassword และ newPassword" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "รหัสผ่านเดิมไม่ถูกต้อง" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    return res.status(500).json({ message: "เปลี่ยนรหัสผ่านไม่สำเร็จ", error: err.message });
  }
}

module.exports = { register, login, logout, changePassword };
