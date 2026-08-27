const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./db');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3017;

app.use(cors());
app.use(express.json());
app.use('/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'analytics-service', status: 'ok' });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('[analytics-service] Connected to shared Postgres instance');
    app.listen(PORT, () => {
      console.log(`[analytics-service] Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[analytics-service] Failed to connect to database:', err);
    process.exit(1);
  }
}

start();
