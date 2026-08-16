/**
 * FILE: user-service/src/models/User.js
 *
 * Sequelize model for the `users` table.
 *
 * Fields:
 *   id            - UUID, primary key, auto-generated
 *   name          - user's display name
 *   email         - unique, used for login
 *   password_hash - bcrypt hash, NEVER the plaintext password
 *   created_at / updated_at - managed automatically by Sequelize timestamps
 */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name cannot be empty." },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        msg: "An account with this email already exists.",
      },
      validate: {
        isEmail: { msg: "Must be a valid email address." },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // NOTE: never expose this field in API responses.
      // See toSafeJSON() below for the safe serialization pattern.
    },
  },
  {
    tableName: "users",
    underscored: true, // uses created_at / updated_at instead of createdAt / updatedAt
    timestamps: true,
  }
);

/**
 * Returns a version of the user object safe to send in API responses —
 * strips out password_hash so it never accidentally leaks to the client.
 */
User.prototype.toSafeJSON = function () {
  const { id, name, email, createdAt } = this;
  return { id, name, email, createdAt };
};

module.exports = User;
