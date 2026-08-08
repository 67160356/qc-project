const { Lot } = require("../models");

// GET /api/dashboard
async function summary(req, res) {
  const lots = await Lot.findAll();

  const total = lots.length;
  const released = lots.filter((l) => l.stage === "released").length;
  const held = lots.filter((l) => l.stage === "held").length;
  const inProgress = total - released - held;

  const byLine = {};
  lots.forEach((l) => {
    byLine[l.line] = byLine[l.line] || { total: 0, released: 0, held: 0 };
    byLine[l.line].total += 1;
    if (l.stage === "released") byLine[l.line].released += 1;
    if (l.stage === "held") byLine[l.line].held += 1;
  });

  return res.json({ total, released, held, inProgress, byLine });
}

module.exports = { summary };
