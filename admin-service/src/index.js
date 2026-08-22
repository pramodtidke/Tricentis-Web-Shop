/**
 * FILE: admin-service/src/index.js
 *
 * ShopWave Admin Service. Runs on port 3015.
 *
 * Provides back-office endpoints for platform administrators:
 *   GET /admin/users  - all registered users (read-only, cross-service)
 *   GET /admin/orders - all system orders (read-only, cross-service)
 *
 * This service is a deliberate exception to "each service owns its own
 * database" — it reads directly from the shared Postgres instance for
 * reporting purposes only. It never writes to tables it doesn't own.
 *
 * Access to every route here is gated by the API Gateway's requireAdmin
 * middleware (checks JWT role === "admin") — this service itself does
 * not re-verify the JWT, trusting the Gateway as the single entry point.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/database");
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 3015;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "admin-service" });
});

app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

app.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: `No route configured for ${req.method} ${req.path}.` });
});

testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Admin Service running at http://localhost:${PORT}`);
      console.log(`   GET /admin/users`);
      console.log(`   GET /admin/orders`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start Admin Service:", error.message);
    process.exit(1);
  });