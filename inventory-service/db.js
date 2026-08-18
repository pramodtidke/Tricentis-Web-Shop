require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

const Inventory = sequelize.define(
  "Inventory",
  {
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    stockLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "inventory",
    timestamps: true,
  }
);

module.exports = { sequelize, Inventory };
