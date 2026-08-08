const { User } = require("../models");

function toPublic(user) {
  return { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role, createdAt: user.createdAt };
}

// GET /api/users/me (protected)
async function getMe(req, res) {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
  return res.json(toPublic(user));
}

// GET /api/users/:id (protected)
async function getById(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
  return res.json(toPublic(user));
}

// GET /api/users?page=1&limit=20 (protected)
async function list(req, res) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;

  const { rows, count } = await User.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return res.json({
    data: rows.map(toPublic),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
}

// PUT /api/users/:id (protected — self or admin)
async function update(req, res) {
  const { id } = req.params;
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({ message: "แก้ไขได้เฉพาะข้อมูลตัวเอง หรือต้องเป็น admin" });
  }

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

  const { email, fullName, role } = req.body;
  if (email) user.email = email;
  if (fullName !== undefined) user.fullName = fullName;
  if (role && req.user.role === "admin") user.role = role;

  await user.save();
  return res.json(toPublic(user));
}

// DELETE /api/users/:id (protected — admin only)
async function remove(req, res) {
  const { id } = req.params;
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "ต้องเป็น admin เท่านั้นที่ลบผู้ใช้ได้" });
  }
  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

  await user.destroy();
  return res.json({ message: "ลบผู้ใช้สำเร็จ" });
}

// GET /api/check-username/:name (public)
async function checkUsername(req, res) {
  const existing = await User.findOne({ where: { username: req.params.name } });
  return res.json({ username: req.params.name, available: !existing });
}

module.exports = { getMe, getById, list, update, remove, checkUsername };
