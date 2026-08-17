const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Order = sequelize.define(
  "Order",
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
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "paid", "shipped"),
      allowNull: false,
      defaultValue: "pending",
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: "orders",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Order;