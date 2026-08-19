const express = require('express');
const axios = require('../utils/httpClient');
const { Transaction } = require('../models');
const { publishPaymentSucceeded } = require('../utils/rabbitmq');

const router = express.Router();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3006';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3004';

// Small helper so every stage logs consistently: [charge:<orderId>] <label> took <ms>ms
function timer(orderId) {
  const start = process.hrtime.bigint();
  return (label) => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[charge:${orderId}] ${label} took ${ms.toFixed(1)}ms`);
    return ms;
  };
}

async function getEmailForOrder(orderId) {
  const lap = timer(orderId);
  try {
    const orderRes = await axios.get(`${ORDER_SERVICE_URL}/orders/${orderId}`);
    lap('  order-service GET /orders/:orderId');

    const { userId } = orderRes.data;
    if (!userId) {
      console.error(`Order ${orderId} has no userId, cannot look up email`);
      return null;
    }

    const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}/profile`);
    lap('  user-service GET /:id/profile');

    return userRes.data.email || null;
  } catch (err) {
    console.error(`Failed to resolve email for order ${orderId}:`, err.message);
    return null;
  }
}

router.post('/charge', async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || amount === undefined || amount === null) {
    return res.status(400).json({ message: 'orderId and amount are required' });
  }

  const lap = timer(orderId);

  try {
    // Mock provider latency (stand-in for a real Stripe/PayPal call)

    const transaction = await Transaction.create({
      orderId,
      amount,
      status: 'success',
      provider: 'stripe_mock',
    });
    lap('Transaction.create (DB write)');

    // Run the order-status update and the email lookup concurrently —
    // neither depends on the other's result, so no reason to serialize them.
    const [statusResult, resolvedEmail] = await Promise.allSettled([
      axios.put(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, { status: 'paid' }),
      getEmailForOrder(orderId),
    ]);
    lap('order-status update + email lookup (parallel)');

    if (statusResult.status === 'rejected') {
      console.error(
        `Payment succeeded but failed to update order ${orderId} status:`,
        statusResult.reason.message
      );
    }

    const email = resolvedEmail.status === 'fulfilled' ? resolvedEmail.value : null;

    publishPaymentSucceeded({
      orderId: orderId,
      email: email,
    });
    lap('publishPaymentSucceeded (RabbitMQ)');

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