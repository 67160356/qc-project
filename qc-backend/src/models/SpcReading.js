const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SpcReading = sequelize.define(
  "SpcReading",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lotId: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.FLOAT, allowNull: false },
    inRange: { type: DataTypes.BOOLEAN, allowNull: false },
    round: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "spc_readings",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = SpcReading;
