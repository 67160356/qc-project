const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Ncr = sequelize.define(
  "Ncr",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lotId: { type: DataTypes.STRING, allowNull: false, unique: true },
    cause: { type: DataTypes.STRING, allowNull: true },
    owner: { type: DataTypes.STRING, allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: {
      type: DataTypes.ENUM("open", "closed"),
      defaultValue: "open",
    },
  },
  {
    tableName: "ncr_cases",
    timestamps: true,
  }
);

module.exports = Ncr;
