const { Lot, ProductSpec, SpcReading, Ncr } = require("../models");

const include = [
  { model: ProductSpec, as: "spec" },
  { model: SpcReading, as: "spcReadings" },
  { model: Ncr, as: "ncr" },
];

// GET /api/lots?stage=&line=
async function list(req, res) {
  const where = {};
  if (req.query.stage) where.stage = req.query.stage;
  if (req.query.line) where.line = req.query.line;

  const lots = await Lot.findAll({ where, include, order: [["createdAt", "ASC"]] });
  return res.json(lots);
}

// POST /api/lots  { id, sku, line }
async function create(req, res) {
  const { id, sku, line } = req.body;
  if (!id || !sku || !line) {
    return res.status(400).json({ message: "ต้องระบุ id, sku, line" });
  }
  const spec = await ProductSpec.findByPk(sku);
  if (!spec) return res.status(400).json({ message: `ไม่พบสเปคของ SKU: ${sku}` });

  const existing = await Lot.findByPk(id);
  if (existing) return res.status(409).json({ message: "รหัสล็อตนี้มีอยู่แล้ว" });

  const lot = await Lot.create({ id, sku, line, stage: "pending" });
  return res.status(201).json(lot);
}

// GET /api/lots/:id
async function getById(req, res) {
  const lot = await Lot.findByPk(req.params.id, { include });
  if (!lot) return res.status(404).json({ message: "ไม่พบล็อตนี้" });
  return res.json(lot);
}

// POST /api/lots/:id/incoming  { result }  ขั้นตอน 2-3: ตรวจ + บันทึกผลขาเข้า
async function submitIncoming(req, res) {
  const lot = await Lot.findByPk(req.params.id);
  if (!lot) return res.status(404).json({ message: "ไม่พบล็อตนี้" });

  const { result } = req.body;
  if (!["pass", "fail"].includes(result)) {
    return res.status(400).json({ message: "result ต้องเป็น pass หรือ fail" });
  }

  lot.stage = "incoming";
  lot.incomingResult = result;
  lot.incomingCheckedAt = new Date();
  await lot.save();
  return res.json(lot);
}

// POST /api/lots/:id/spc-readings  { value }  ขั้นตอน 4: ตรวจระหว่างผลิต (SPC)
async function addSpcReading(req, res) {
  const lot = await Lot.findByPk(req.params.id, { include: [{ model: ProductSpec, as: "spec" }] });
  if (!lot) return res.status(404).json({ message: "ไม่พบล็อตนี้" });

  const value = parseFloat(req.body.value);
  if (isNaN(value)) return res.status(400).json({ message: "value ต้องเป็นตัวเลข" });

  const spec = lot.spec;
  const inRange = value >= spec.min && value <= spec.max;
  const round = (await SpcReading.count({ where: { lotId: lot.id } })) + 1;

  const reading = await SpcReading.create({ lotId: lot.id, value, inRange, round });

  if (lot.stage === "pending" || lot.stage === "incoming") lot.stage = "inprocess";
  await lot.save();

  return res.status(201).json({
    reading,
    outOfRange: !inRange,
    // ขั้นตอน 5: ถ้าออกนอกเกณฑ์ ฝั่ง frontend จะพาไปหน้าแจ้งเตือนต่อ (รับทราบ / สั่งหยุดไลน์)
  });
}

// POST /api/lots/:id/final  { passCount, failCount }  ขั้นตอน 6: ตรวจสินค้าสำเร็จรูป
async function submitFinal(req, res) {
  const lot = await Lot.findByPk(req.params.id);
  if (!lot) return res.status(404).json({ message: "ไม่พบล็อตนี้" });

  const { passCount, failCount } = req.body;
  if (typeof passCount !== "number" || typeof failCount !== "number") {
    return res.status(400).json({ message: "ต้องระบุ passCount และ failCount เป็นตัวเลข" });
  }

  lot.stage = "final";
  lot.finalPassCount = passCount;
  lot.finalFailCount = failCount;
  lot.finalResult = failCount === 0 ? "pass" : "fail";
  await lot.save();
  return res.json(lot);
}

// POST /api/lots/:id/decision  { decision }  ขั้นตอน 7: ตัดสินใจผ่าน/ไม่ผ่าน
async function submitDecision(req, res) {
  const lot = await Lot.findByPk(req.params.id);
  if (!lot) return res.status(404).json({ message: "ไม่พบล็อตนี้" });

  const { decision } = req.body;
  if (!["released", "held"].includes(decision)) {
    return res.status(400).json({ message: "decision ต้องเป็น released หรือ held" });
  }

  lot.stage = decision;
  lot.decision = decision;
  await lot.save();

  if (decision === "held") {
    await Ncr.findOrCreate({ where: { lotId: lot.id }, defaults: { lotId: lot.id, status: "open" } });
  }

  return res.json(lot);
}

module.exports = { list, create, getById, submitIncoming, addSpcReading, submitFinal, submitDecision };
