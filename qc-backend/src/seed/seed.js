require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize, ProductSpec, User } = require("../models");

const specs = [
  { sku: "SKU-1180", name: "ขวดพลาสติก PET 250ml", param: "น้ำหนักขวด (g)", min: 11.8, max: 12.6, sampleSize: 20, aqlLevel: "AQL 2.5" },
  { sku: "SKU-3305", name: "แผ่นฟิล์มบรรจุภัณฑ์ 40 mic", param: "ความหนา (micron)", min: 38, max: 42, sampleSize: 8, aqlLevel: "AQL 1.0" },
];

async function seed() {
  await sequelize.sync();

  for (const s of specs) {
    await ProductSpec.upsert(s);
  }
  console.log(`เพิ่มสเปคสินค้าแล้ว ${specs.length} รายการ`);

  const adminExists = await User.findOne({ where: { username: "admin" } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("Admin1234!", 10);
    await User.create({
      username: "admin",
      email: "admin@qc-line.local",
      passwordHash,
      fullName: "ผู้ดูแลระบบ",
      role: "admin",
    });
    console.log("สร้างบัญชี admin เริ่มต้นแล้ว (username: admin / password: Admin1234!)");
  } else {
    console.log("มีบัญชี admin อยู่แล้ว ข้ามการสร้าง");
  }

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Seed ล้มเหลว:", err.message);
  process.exit(1);
});
