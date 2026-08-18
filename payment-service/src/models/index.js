const sequelize = require('../config/database');
const Transaction = require('./Transaction');

module.exports = {
  sequelize,
  Transaction,
};