const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ProductSpec = sequelize.define(
  "ProductSpec",
  {
    sku: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    param: { type: DataTypes.STRING, allowNull: false },
    min: { type: DataTypes.FLOAT, allowNull: false },
    max: { type: DataTypes.FLOAT, allowNull: false },
    sampleSize: { type: DataTypes.INTEGER, allowNull: false },
    aqlLevel: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "product_specs",
    timestamps: false,
  }
);

module.exports = ProductSpec;
