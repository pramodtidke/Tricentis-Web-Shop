/**
 * FILE: user-service/src/config/database.js
 *
 * Sequelize connection to the local PostgreSQL container.
 *
 * Assumes PostgreSQL is running locally (e.g. via Docker):
 *   docker run --name shopwave-postgres \
 *     -e POSTGRES_PASSWORD=postgres \
 *     -e POSTGRES_DB=shopwave_users \
 *     -p 5432:5432 -d postgres:16
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
    logging: false, // set to console.log to see raw SQL queries during debugging
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

/**
 * Call this once on service startup to verify the DB is reachable.
 * Throws if the connection fails so the service fails fast with a
 * clear error instead of silently accepting requests it can't fulfill.
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connection established (user-service)");
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL:", error.message);
    throw error;
  }
}

module.exports = { sequelize, testConnection };
