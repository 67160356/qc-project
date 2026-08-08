const { ProductSpec } = require("../models");

// GET /api/specs
async function list(req, res) {
  const specs = await ProductSpec.findAll();
  return res.json(specs);
}

// GET /api/specs/:sku
async function getBySku(req, res) {
  const spec = await ProductSpec.findByPk(req.params.sku);
  if (!spec) return res.status(404).json({ message: "ไม่พบสเปคของ SKU นี้" });
  return res.json(spec);
}

module.exports = { list, getBySku };
