const sequelize = require("../config/db");
const User = require("./User");
const ProductSpec = require("./ProductSpec");
const Lot = require("./Lot");
const SpcReading = require("./SpcReading");
const Ncr = require("./Ncr");

Lot.belongsTo(ProductSpec, { foreignKey: "sku", targetKey: "sku", as: "spec" });
ProductSpec.hasMany(Lot, { foreignKey: "sku", sourceKey: "sku" });

Lot.hasMany(SpcReading, { foreignKey: "lotId", as: "spcReadings" });
SpcReading.belongsTo(Lot, { foreignKey: "lotId" });

Lot.hasOne(Ncr, { foreignKey: "lotId", as: "ncr" });
Ncr.belongsTo(Lot, { foreignKey: "lotId" });

module.exports = { sequelize, User, ProductSpec, Lot, SpcReading, Ncr };
