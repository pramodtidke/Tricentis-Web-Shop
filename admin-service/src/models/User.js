/**
 * FILE: admin-service/src/models/User.js
 *
 * Read-only mirror of User Service's `users` table. Admin Service reads
 * directly from the shared Postgres instance for back-office reporting —
 * it never writes to this table (User Service owns writes).
 *
 * Field definitions must stay in sync with user-service/src/models/User.js.
 * Deliberately omits password_hash — Admin Service never needs it and
 * should never expose it, even accidentally via a stray `SELECT *`.
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
    },
  },
  {
    tableName: "users",
    underscored: true,
    timestamps: true,
  }
);

module.exports = User;