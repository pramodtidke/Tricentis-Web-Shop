/**
 * FILE: user-service/src/index.js
 *
 * User Service entry point. Runs on port 3004.
 *
 * Responsibilities (per the System Design Doc):
 *   - User registration (POST /users/register)
 *   - Profile lookup (GET /users/:id/profile)
 *   - Owns the PostgreSQL `users` table exclusively — no other service
 *     should read/write this table directly.
 */
require('../tracing'); // adjust relative path if entry file isn't directly in src/
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize, testConnection } = require("./config/database");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3004;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Health check — useful for the API Gateway / Docker healthchecks ─────────

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "user-service" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/users", userRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

async function start() {
  try {
    await testConnection();

    // Creates the `users` table if it doesn't exist yet, and adds any
    // missing columns. Safe to run every time in development.
    // In production this should be replaced with proper migrations
    // (e.g. sequelize-cli migrations) instead of sync().
    await sequelize.sync();
    console.log("✅ Database synced (users table ready)");

    app.listen(PORT, () => {
      console.log(`✅ User Service running at http://localhost:${PORT}`);
      console.log(`   POST /users/register`);
      console.log(`   GET  /users/:id/profile`);
    });
  } catch (error) {
    console.error("❌ Failed to start User Service:", error);
    process.exit(1);
  }
}

start();
