require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');

const PORT = process.env.PORT || 3010;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopwave_notifications';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'order_events';

const app = express();
app.use(express.json());

// --- Mongo model ---
const notificationSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  orderId: { type: String, required: true },
  email: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// --- Mock "send email" ---
function mockSendEmail(to, subject, body) {
  console.log(`[MOCK EMAIL] To: ${to || 'unknown'} | Subject: ${subject}`);
  console.log(`[MOCK EMAIL] Body: ${body}`);
}

// --- Event handling ---
async function handleEvent(eventType, payload) {
  const { orderId, email } = payload;

  let subject, body;
  switch (eventType) {
    case 'OrderPlaced':
      subject = `Order Confirmed: ${orderId}`;
      body = `Your order ${orderId} has been placed successfully.`;
      break;
    case 'PaymentSucceeded':
      subject = `Payment Received: ${orderId}`;
      body = `We've received payment for order ${orderId}. It's now being processed.`;
      break;
    default:
      subject = `Update on order ${orderId}`;
      body = `Event: ${eventType}`;
  }

  mockSendEmail(email, subject, body);

  try {
    await Notification.create({
      eventType,
      orderId,
      email,
      message: body,
      status: 'sent'
    });
    console.log(`[DB] Notification logged for ${eventType} - order ${orderId}`);
  } catch (err) {
    console.error(`[DB] Failed to log notification:`, err.message);
  }
}

// --- RabbitMQ consumer ---
async function startConsumer() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });
  channel.prefetch(1);

  console.log(`[RabbitMQ] Waiting for messages in "${QUEUE_NAME}"...`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const { eventType, ...payload } = content;

      console.log(`[RabbitMQ] Received event: ${eventType}`);
      await handleEvent(eventType, payload);

      channel.ack(msg);
    } catch (err) {
      console.error('[RabbitMQ] Failed to process message:', err.message);
      channel.nack(msg, false, false);
    }
  }, { noAck: false });

  connection.on('error', (err) => {
    console.error('[RabbitMQ] Connection error:', err.message);
  });
  connection.on('close', () => {
    console.error('[RabbitMQ] Connection closed. Exiting so Docker/nodemon can restart.');
    process.exit(1);
  });
}

// --- Health check route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

// --- Startup ---
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Mongo] Connected');

    await startConsumer();

    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start Notification Service:', err.message);
    process.exit(1);
  }
}

start();