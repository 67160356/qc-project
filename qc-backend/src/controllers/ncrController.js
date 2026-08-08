const { Ncr, Lot, ProductSpec } = require("../models");

// GET /api/ncr
async function list(req, res) {
  const where = {};
  if (req.query.status) where.status = req.query.status;

  const cases = await Ncr.findAll({
    where,
    include: [{ model: Lot, include: [{ model: ProductSpec, as: "spec" }] }],
    order: [["createdAt", "DESC"]],
  });
  return res.json(cases);
}

// PUT /api/ncr/:lotId  { cause, owner, dueDate, status }
async function update(req, res) {
  const ncr = await Ncr.findOne({ where: { lotId: req.params.lotId } });
  if (!ncr) return res.status(404).json({ message: "ไม่พบเคส NCR ของล็อตนี้" });

  const { cause, owner, dueDate, status } = req.body;
  if (cause !== undefined) ncr.cause = cause;
  if (owner !== undefined) ncr.owner = owner;
  if (dueDate !== undefined) ncr.dueDate = dueDate;
  if (status !== undefined) {
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "status ต้องเป็น open หรือ closed" });
    }
    ncr.status = status;
  }

  await ncr.save();
  return res.json(ncr);
}

module.exports = { list, update };
