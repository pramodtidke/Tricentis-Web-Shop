/**
 * FILE: user-service/src/routes/userRoutes.js
 *
 * User Service routes.
 *
 *   POST /users/register    - create a new account (Task 2)
 *   GET  /users/:id/profile - fetch user details (used by the frontend
 *                             profile page — included so the service is
 *                             immediately compatible with Day 2's frontend)
 */

const express = require("express");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const User = require("../models/User");

const router = express.Router();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// ─── POST /users/register ─────────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email, and password are all required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    // Check for existing user with this email (case-insensitive)
    const existingUser = await User.findOne({
      where: { email: { [Op.iLike]: email.trim() } },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Hash the password — NEVER store plaintext passwords
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: newUser.toSafeJSON(),
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Sequelize validation errors (e.g. invalid email format)
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: error.errors[0]?.message || "Invalid input.",
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// ─── GET /users/:id/profile ───────────────────────────────────────────────────

router.get("/:id/profile", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user.toSafeJSON());
  } catch (error) {
    console.error("Fetch profile error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// ─── Internal route — used by the Auth Service to verify credentials ─────────
// This is NOT exposed publicly through the API Gateway; only the Auth
// Service should call it (service-to-service, e.g. over the internal
// Docker network). See Task 3 in the Auth Service for the caller side.

router.get("/internal/by-email/:email", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: req.params.email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Includes password_hash — internal use only, never expose via Gateway
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      password_hash: user.password_hash,
    });
  } catch (error) {
    console.error("Internal lookup error:", error);
    return res.status(500).json({ message: "Internal error." });
  }
});

module.exports = router;
