const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const lotRoutes = require("./routes/lotRoutes");
const ncrRoutes = require("./routes/ncrRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const specRoutes = require("./routes/specRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Authentication: /api/register /api/login /api/logout /api/change-password
app.use("/api", authRoutes);
// User management: /api/me /api/users /api/users/:id /api/check-username/:name
app.use("/api", userRoutes);
// QC domain: ครอบคลุม user journey 9 ขั้นตอนของระบบ QC Line
app.use("/api/lots", lotRoutes);
app.use("/api/ncr", ncrRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/specs", specRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "ไม่พบเส้นทางนี้" });
});

// error handler กลาง
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์", error: err.message });
});

module.exports = app;
