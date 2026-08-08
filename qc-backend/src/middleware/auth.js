const { verifyToken } = require("../utils/jwt");
const { isBlacklisted } = require("../utils/tokenBlacklist");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "ต้องแนบ Authorization: Bearer <token>" });
  }
  if (isBlacklisted(token)) {
    return res.status(401).json({ message: "Token นี้ถูก logout ไปแล้ว กรุณาเข้าสู่ระบบใหม่" });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token ไม่ถูกต้องหรือหมดอายุ" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงส่วนนี้" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
