# QC LINE — ระบบควบคุมคุณภาพสินค้า (Frontend)

โปรเจกต์ React + Vite + Tailwind ที่ครอบคลุม User Journey QC ครบ 9 ขั้นตอน
(Incoming → In-process → Final → Decision → NCR → Dashboard)

> **อัปเดต**: ตอนนี้เชื่อมกับ backend REST API จริงแล้ว (ดูโฟลเดอร์ `qc-backend`) —
> ไม่ใช่ mock state ในเบราว์เซอร์อีกต่อไป ต้องรัน backend ก่อนถึงจะใช้งานหน้านี้ได้

## รันดูบนเครื่องตัวเอง

**ขั้นที่ 1 — รัน backend ก่อน** (ดูรายละเอียดใน `qc-backend/README.md`):
```bash
cd qc-backend
cp .env.example .env
docker compose up --build
docker compose exec api npm run seed   # อีก terminal
```

**ขั้นที่ 2 — รัน frontend**:
```bash
npm install
npm run dev
```

แล้วเปิด `http://localhost:5173` — จะเจอหน้า **เข้าสู่ระบบ** ก่อน ใช้บัญชีตั้งต้น:
- Username: `admin`
- Password: `Admin1234!`

ถ้า backend รันอยู่คนละเครื่อง/คนละ port ให้แก้ค่า `API_BASE` บนสุดของ `src/App.jsx`


## โครงสร้างไฟล์

```
qc-project/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
└─ src/
   ├─ main.jsx
   ├─ App.jsx      ← โค้ด UI ทั้งหมด (9 หน้าจอ)
   └─ index.css
```

---

## วิธีนำส่ง Link Repository (สำหรับส่งอาจารย์)

### 1) สร้างบัญชี GitHub (ถ้ายังไม่มี)
ไปที่ https://github.com/signup

### 2) สร้าง repository ใหม่
1. กดปุ่ม **+** มุมขวาบน → **New repository**
2. ตั้งชื่อ เช่น `qc-line-frontend` (หรือชื่อที่ตรงกับอุตสาหกรรมที่ได้รับมอบหมาย)
3. เลือก **Public** (เพื่อให้อาจารย์เปิดลิงก์ดูได้)
4. **อย่าติ๊ก** "Add a README file" (เพราะเรามีไฟล์โปรเจกต์อยู่แล้ว)
5. กด **Create repository**

หลังสร้างเสร็จ GitHub จะโชว์คำสั่งไว้ให้ — ใช้ชุด **"…or push an existing repository from the command line"**

### 3) เปิด Terminal ที่โฟลเดอร์โปรเจกต์แล้วรันคำสั่งนี้ (แก้ URL ให้เป็นของตัวเอง)

```bash
cd qc-project
git init
git add .
git commit -m "initial commit: QC frontend UI ตาม user journey"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/qc-line-frontend.git
git push -u origin main
```

> ถ้าเป็นครั้งแรกที่ push บนเครื่อง อาจต้อง login ผ่านหน้าต่างที่ GitHub เด้งขึ้นมา (หรือใช้ Personal Access Token แทนรหัสผ่านถ้าถูกถาม)

### 4) ได้ลิงก์ repository
หน้า repo ของคุณจะอยู่ที่ (ใช้ลิงก์นี้ส่งอาจารย์):

```
https://github.com/<ชื่อผู้ใช้>/qc-line-frontend
```

### 5) (ทางเลือก) Deploy ให้ดูของจริงผ่านเว็บได้เลย
ถ้าอยากได้ลิงก์เว็บที่ใช้งานได้จริง ไม่ใช่แค่โค้ด:

- **Vercel**: เข้า https://vercel.com → "Add New Project" → เชื่อม GitHub → เลือก repo นี้ → Deploy (ตั้งค่า default พอ เพราะเป็น Vite project อยู่แล้ว)
- **Netlify**: เข้า https://netlify.com → "Add new site" → "Import an existing project" → เลือก repo → Build command: `npm run build`, Publish directory: `dist`

จากนั้นจะได้ลิงก์เว็บ เช่น `https://qc-line-frontend.vercel.app` ใส่ไว้ใน README หรือส่งคู่กับลิงก์ repo ได้เลย

---

## หมายเหตุ
โปรเจกต์นี้เป็น **Frontend เท่านั้น (UI mock)** — ข้อมูลทั้งหมดเก็บใน React state ของฝั่ง browser ยังไม่ได้เชื่อมต่อฐานข้อมูล/backend จริง เหมาะสำหรับสาธิต User Journey และรอต่อยอด API ในขั้นถัดไป
