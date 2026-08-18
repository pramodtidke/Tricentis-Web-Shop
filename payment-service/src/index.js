require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/payments', paymentRoutes);

// Catch-all 404 -- must stay LAST, after all real routes are registered.
app.use((req, res) => {
  res.status(404).json({ message: 'No route configured for this path' });
});

const PORT = process.env.PORT || 3008;

sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Payment Service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });