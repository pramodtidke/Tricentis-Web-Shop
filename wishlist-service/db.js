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
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const WishlistItem = sequelize.define(
  "WishlistItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "wishlist_items",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"],
      },
    ],
  }
);

module.exports = { sequelize, WishlistItem };
