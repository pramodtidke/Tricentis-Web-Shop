/**
 * FILE: admin-service/src/models/Order.js
 *
 * Read-only mirror of Order Service's `orders` table. Admin Service
 * reads directly from the shared Postgres instance for back-office
 * reporting — it never writes to this table (Order Service owns writes).
 *
 * Field definitions must stay in sync with order-service/src/models/Order.js.
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.UUID,
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