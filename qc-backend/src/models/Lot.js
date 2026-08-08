const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Lot = sequelize.define(
  "Lot",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true, // e.g. LOT-260718-02
    },
    sku: { type: DataTypes.STRING, allowNull: false },
    line: { type: DataTypes.STRING, allowNull: false },
    stage: {
      type: DataTypes.ENUM("pending", "incoming", "inprocess", "final", "released", "held"),
      defaultValue: "pending",
    },
    incomingResult: { type: DataTypes.ENUM("pass", "fail"), allowNull: true },
    incomingCheckedAt: { type: DataTypes.DATE, allowNull: true },
    finalPassCount: { type: DataTypes.INTEGER, allowNull: true },
    finalFailCount: { type: DataTypes.INTEGER, allowNull: true },
    finalResult: { type: DataTypes.ENUM("pass", "fail"), allowNull: true },
    decision: { type: DataTypes.ENUM("released", "held"), allowNull: true },
  },
  {
    tableName: "lots",
    timestamps: true,
  }
);

module.exports = Lot;
