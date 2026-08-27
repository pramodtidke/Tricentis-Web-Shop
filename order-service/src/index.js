require("../tracing"); // adjust relative path if entry file isn't directly in src/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/database");
require("./models");
const orderRoutes = require("./routes/orderRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3006;

app.use("/orders", orderRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ service: "order-service", status: "ok" });
});

async function startServer() {
  await testConnection();
  await sequelize.sync();
  console.log("Database synced (orders tables ready)");

  app.listen(PORT, function () {
    console.log("Order Service running at http://localhost:" + PORT);
    console.log("   POST /orders/checkout");
  });
}

startServer().catch(function (err) {
  console.error("Failed to start Order Service:", err);
  process.exit(1);
});

module.exports = app;
