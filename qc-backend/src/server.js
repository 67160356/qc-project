require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("เชื่อมต่อฐานข้อมูลสำเร็จ");

    await sequelize.sync(); // สร้างตารางอัตโนมัติถ้ายังไม่มี (โปรเจกต์นิสิต — production ควรใช้ migration แทน)
    console.log("Sync โมเดลกับฐานข้อมูลเรียบร้อย");

    app.listen(PORT, () => {
      console.log(`QC Line API กำลังทำงานที่ http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("เริ่มต้นเซิร์ฟเวอร์ไม่สำเร็จ:", err.message);
    process.exit(1);
  }
}

start();
