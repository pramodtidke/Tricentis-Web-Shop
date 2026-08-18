const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false,
    defaultValue: 'failed',
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'stripe_mock',
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

module.exports = Transaction;