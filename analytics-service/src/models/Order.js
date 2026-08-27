const { DataTypes } = require('sequelize');
const sequelize = require('../db');

// CONFIRMED SCHEMA - copied directly from order-service/src/models/Order.js
// (Day 10, verified against source, not guessed). Keep this in sync if
// Person A changes the Order Service model; this is a mirror, not the
// source of truth.
//
// This model is READ-ONLY: no migrations, no sync(), no writes.
// Analytics does not own this table and must never alter its schema.
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped'),
      allowNull: false
    }
  },
  {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    freezeTableName: true
  }
);

module.exports = Order;
