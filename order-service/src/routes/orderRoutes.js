const express = require("express");
const axios = require("axios");
const { sequelize } = require("../config/database");
const { Order, OrderItem } = require("../models");

const router = express.Router();

const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3005";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3004";
const { publishOrderPlaced } = require("../utils/rabbitmq");

async function getEmailForUser(userId) {
  try {
    const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}/profile`);
    return userRes.data.email || null;
  } catch (err) {
    console.error(`Failed to resolve email for user ${userId}:`, err.message);
    return null;
  }
}

router.post("/checkout", async (req, res) => {
  const { userId, shippingAddress } = req.body;

  if (!userId || !shippingAddress) {
    return res.status(400).json({
      message: "userId and shippingAddress are required.",
    });
  }

  const t = await sequelize.transaction();

  try {
    let cartItems;
    try {
      const cartRes = await axios.get(CART_SERVICE_URL + "/cart/" + userId);
      cartItems = cartRes.data.items;
    } catch (error) {
      await t.rollback();
      return res.status(502).json({
        message: "Unable to reach Cart Service. Please try again.",
      });
    }

    if (!cartItems || cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: "Your cart is empty. Add items before checking out.",
      });
    }

    const totalAmount = cartItems.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);

    const order = await Order.create(
      {
        userId: userId,
        totalAmount: totalAmount,
        status: "pending",
        shippingAddress: shippingAddress,
      },
      { transaction: t }
    );

    const orderItems = cartItems.map(function (item) {
      return {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
    });
    await OrderItem.bulkCreate(orderItems, { transaction: t });

    await t.commit();

    try {
      await axios.delete(CART_SERVICE_URL + "/cart/" + userId);
    } catch (error) {
      console.error(
        "Order " + order.id + " created, but failed to clear cart for user " + userId + ":",
        error.message
      );
    }

        // Best-effort: resolve email and publish OrderPlaced — never blocks checkout
    const resolvedEmail = await getEmailForUser(userId);
    publishOrderPlaced({
      orderId: order.id,
      email: resolvedEmail,
    });

    return res.status(201).json({
      message: "Order placed successfully.",
      orderId: order.id,
      totalAmount: totalAmount,
      status: order.status,
    });
  } catch (error) {
    await t.rollback();
    console.error("Checkout error:", error);
    return res.status(500).json({
      message: "Something went wrong while processing your order.",
    });
  }
});

router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      status: order.status,
    });
  } catch (err) {
    console.error(`Failed to fetch order ${orderId}:`, err.message);
    return res.status(500).json({ message: 'Failed to fetch order' });
  }
});

router.put('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'paid', 'shipped'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      orderId: order.id,
      status: order.status,
    });
  } catch (err) {
    console.error(`Failed to update status for order ${orderId}:`, err.message);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
});

module.exports = router;