/**
 * FILE: admin-service/src/config/database.js
 *
 * Sequelize connection to the shared PostgreSQL container (port 5433,
 * mapped from the container's internal 5432 — same instance User Service,
 * Order Service, and Payment Service use).
 *
 * NOTE: Admin Service is a deliberate, documented exception to the
 * "each service owns its own database" principle — it reads across
 * User/Order tables directly for back-office reporting. It never writes
 * to tables it doesn't own.
 */

require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connection established (admin-service)");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error.message);
    throw error;
  }
}

module.exports = { sequelize, testConnection };