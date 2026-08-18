const express = require('express');
const axios = require('axios');
const { Transaction } = require('../models');

const router = express.Router();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3006';

router.post('/charge', async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || amount === undefined || amount === null) {
    return res.status(400).json({ message: 'orderId and amount are required' });
  }

  try {
    // Mock provider latency (stand-in for a real Stripe/PayPal call)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const transaction = await Transaction.create({
      orderId,
      amount,
      status: 'success',
      provider: 'stripe_mock',
    });

    // Best-effort notify Order Service that payment succeeded.
    // Mirrors the cart-clear pattern in order-service: log, don't throw,
    // on failure -- the charge itself already succeeded and was persisted.
    try {
      await axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, {
        status: 'paid',
      });
    } catch (statusErr) {
      console.error(
        `Payment succeeded but failed to update order ${orderId} status:`,
        statusErr.message
      );
    }

    return res.status(201).json({
      transactionId: transaction.id,
      orderId: transaction.orderId,
      amount: transaction.amount,
      status: transaction.status,
      provider: transaction.provider,
      createdAt: transaction.createdAt,
    });
  } catch (err) {
    console.error('Payment charge failed:', err.message);
    return res.status(500).json({ message: 'Payment processing failed' });
  }
});

module.exports = router;