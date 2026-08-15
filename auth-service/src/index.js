/**
 * FILE: auth-service/src/index.js
 *
 * Auth Service entry point — upgraded for Day 4. Runs on port 3001.
 *
 * Now connects to Redis on startup (for session storage) and calls out
 * to the User Service for credential lookups instead of using dummy data.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectRedis } = require("./config/redis");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

app.use("/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

async function start() {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`✅ Auth Service running at http://localhost:${PORT}`);
      console.log(`   POST /auth/login`);
      console.log(`   POST /auth/logout`);
      console.log(`   POST /auth/refresh`);
    });
  } catch (error) {
    console.error("❌ Failed to start Auth Service:", error);
    process.exit(1);
  }
}

start();
