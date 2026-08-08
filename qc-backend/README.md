# QC Line — Backend REST API

REST API สำหรับระบบ QC Line (โรงงานผลิต) รองรับ Authentication, User Management,
และ QC Domain ตาม user journey 9 ขั้นตอนของฝั่ง frontend ใช้ **Docker & Docker Compose**
จัดการ container ทั้งหมด (API service + PostgreSQL)

## สแตกที่ใช้
- Node.js + Express
- PostgreSQL + Sequelize (ORM)
- JWT (jsonwebtoken) สำหรับ Authentication + bcryptjs สำหรับ hash รหัสผ่าน
- Docker / Docker Compose

---

## วิธีรันด้วย Docker (แนะนำ)

```bash
cd qc-backend
cp .env.example .env
docker compose up --build
```

รอจน service `db` healthy แล้ว `api` จะเริ่มทำงานที่ **http://localhost:4000**

Seed ข้อมูลตั้งต้น (สเปคสินค้า + บัญชี admin) — รันในอีก terminal ขณะ container ทำงานอยู่:
```bash
docker compose exec api npm run seed
```
จะได้บัญชี `admin` / `Admin1234!` และสเปคสินค้า 2 SKU (`SKU-1180`, `SKU-3305`)

ปิดระบบ:
```bash
docker compose down          # หยุด container
docker compose down -v       # หยุด + ลบข้อมูลใน volume ด้วย
```

## วิธีรันแบบไม่ใช้ Docker (สำหรับ dev บนเครื่อง)
ต้องมี PostgreSQL รันอยู่แล้วเอง แก้ `.env` ให้ `DB_HOST=localhost` แล้ว:
```bash
npm install
npm run seed
npm run dev
```

---

## Endpoint ทั้งหมด

### Authentication
| Method | Path | Auth | คำอธิบาย |
|---|---|---|---|
| POST | `/api/register` | - | สมัครสมาชิก `{ username, email, password, fullName }` |
| POST | `/api/login` | - | เข้าสู่ระบบ `{ username, password }` → คืน JWT |
| POST | `/api/logout` | Bearer | ออกจากระบบ (blacklist token) |
| POST | `/api/change-password` | Bearer | เปลี่ยนรหัสผ่าน `{ oldPassword, newPassword }` |

### User Management
| Method | Path | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/me` | Bearer | ข้อมูลตัวเอง |
| GET | `/api/users/:id` | Bearer | ข้อมูล user ตาม id |
| GET | `/api/users?page=&limit=` | Bearer | รายการ user ทั้งหมด (pagination) |
| PUT | `/api/users/:id` | Bearer | แก้ไขข้อมูล user (ตัวเอง หรือ admin) |
| DELETE | `/api/users/:id` | Bearer (admin) | ลบ user |
| GET | `/api/check-username/:name` | - | ตรวจสอบว่า username ว่างไหม |

### QC Domain (ตาม user journey 9 ขั้นตอน)
| Method | Path | Auth | คำอธิบาย |
|---|---|---|---|
| GET | `/api/lots?stage=&line=` | Bearer | รายการล็อตทั้งหมด |
| POST | `/api/lots` | Bearer | สร้างล็อตใหม่ `{ id, sku, line }` |
| GET | `/api/lots/:id` | Bearer | รายละเอียดล็อต |
| POST | `/api/lots/:id/incoming` | Bearer | บันทึกผลตรวจขาเข้า `{ result: "pass"|"fail" }` |
| POST | `/api/lots/:id/spc-readings` | Bearer | บันทึกค่า SPC ระหว่างผลิต `{ value }` |
| POST | `/api/lots/:id/final` | Bearer | บันทึกผลตรวจสำเร็จรูป `{ passCount, failCount }` |
| POST | `/api/lots/:id/decision` | Bearer | ตัดสินใจ `{ decision: "released"|"held" }` |
| GET | `/api/ncr?status=` | Bearer | รายการเคส NCR |
| PUT | `/api/ncr/:lotId` | Bearer | อัปเดตเคส NCR `{ cause, owner, dueDate, status }` |
| GET | `/api/dashboard` | Bearer | สรุปสถิติล็อตทั้งหมด |
| GET | `/api/specs` / `/api/specs/:sku` | Bearer | สเปค AQL ของสินค้า |

ทุก endpoint ที่มี Auth = Bearer ต้องแนบ header:
```
Authorization: Bearer <token>
```

---

## โครงสร้างไฟล์
```
qc-backend/
├─ docker-compose.yml
├─ Dockerfile
├─ .env.example
├─ package.json
└─ src/
   ├─ server.js          ← จุดเริ่มต้น เชื่อม DB + sync models + listen
   ├─ app.js              ← ประกอบ express app + mount routes
   ├─ config/db.js        ← การเชื่อมต่อ Sequelize/Postgres
   ├─ models/             ← User, ProductSpec, Lot, SpcReading, Ncr
   ├─ middleware/auth.js  ← ตรวจ JWT (requireAuth, requireRole)
   ├─ controllers/        ← logic ของแต่ละ endpoint
   ├─ routes/             ← กำหนดเส้นทาง URL
   └─ seed/seed.js         ← ข้อมูลตั้งต้น (สเปคสินค้า + admin)
```

## ทดสอบผ่านแล้ว (รันจริงกับ PostgreSQL)
- สมัคร/login/logout + JWT ปฏิเสธ token ที่ logout ไปแล้ว
- Journey เต็ม: สร้างล็อต → ตรวจขาเข้า → บันทึกค่า SPC (รวมกรณีออกนอกเกณฑ์) → ตรวจสำเร็จรูป → ตัดสินใจ → สร้างเคส NCR อัตโนมัติ → อัปเดต NCR
- Dashboard สรุปสถิติถูกต้องตามข้อมูลจริงในฐานข้อมูล

---

## นำขึ้น GitHub
ขั้นตอนเดียวกับฝั่ง frontend — ดู README ของโปรเจกต์ frontend หรือทำตามนี้:
```bash
git init
git add .
git commit -m "initial commit: QC backend REST API + Docker Compose"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/qc-line-backend.git
git push -u origin main
```

> **หมายเหตุความปลอดภัย**: ไฟล์ `.env` ถูกใส่ใน `.gitignore` แล้ว อย่า commit ค่า secret จริงขึ้น GitHub — ให้ใช้ `.env.example` เป็นแม่แบบเท่านั้น
