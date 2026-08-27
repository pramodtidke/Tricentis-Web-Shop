const express = require('express');
const { fn, col, Op } = require('sequelize');
const Order = require('../models/Order');

const router = express.Router();

// GET /analytics/sales
// Real status enum: 'pending' | 'paid' | 'shipped'.
// ASSUMPTION (not yet confirmed with Person A): revenue = 'paid' or 'shipped' orders.
router.get('/sales', async (req, res) => {
  try {
    const result = await Order.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('total_amount')), 0), 'totalRevenue'],
        [fn('COUNT', col('id')), 'totalOrders'],
        [fn('COALESCE', fn('AVG', col('total_amount')), 0), 'averageOrderValue']
      ],
      where: { status: { [Op.in]: ['paid', 'shipped'] } },
      raw: true
    });

    res.status(200).json({
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      totalOrders: parseInt(result.totalOrders, 10) || 0,
      averageOrderValue: parseFloat(result.averageOrderValue) || 0
    });
  } catch (err) {
    console.error('[analytics-service] /analytics/sales error:', err);
    res.status(500).json({ error: 'Failed to compute sales analytics' });
  }
});

module.exports = router;
