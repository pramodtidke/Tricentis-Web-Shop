/**
 * FILE: auth-service/src/config/redis.js
 *
 * Redis connection for storing active JWT sessions.
 *
 * Assumes Redis is running locally (e.g. via Docker):
 *   docker run --name shopwave-redis -p 6379:6379 -d redis:7
 */

require("dotenv").config();
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connection established (auth-service)");
});

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

module.exports = { redisClient, connectRedis };
