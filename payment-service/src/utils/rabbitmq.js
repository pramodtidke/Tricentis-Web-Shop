const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const QUEUE_NAME = 'order_events';

let rabbitChannel = null;

async function getRabbitChannel() {
  if (rabbitChannel) return rabbitChannel;

  const connection = await amqp.connect(RABBITMQ_URL);
  rabbitChannel = await connection.createChannel();
  await rabbitChannel.assertQueue(QUEUE_NAME, { durable: true });

  connection.on('error', (err) => {
    console.error('[RabbitMQ] Connection error:', err.message);
    rabbitChannel = null;
  });
  connection.on('close', () => {
    console.error('[RabbitMQ] Connection closed');
    rabbitChannel = null;
  });

  return rabbitChannel;
}

async function publishPaymentSucceeded({ orderId, email }) {
  try {
    const channel = await getRabbitChannel();
    const event = {
      eventType: 'PaymentSucceeded',
      orderId,
      email,
      timestamp: new Date().toISOString()
    };
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(event)), {
      persistent: true
    });
    console.log(`[RabbitMQ] Published PaymentSucceeded for order ${orderId}`);
  } catch (err) {
    console.error('[RabbitMQ] Failed to publish PaymentSucceeded:', err.message);
  }
}

module.exports = { publishPaymentSucceeded };