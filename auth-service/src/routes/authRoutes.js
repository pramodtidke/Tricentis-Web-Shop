/**
 * FILE: auth-service/src/routes/authRoutes.js
 *
 * Auth Service routes — upgraded for Day 4.
 *
 *   POST /auth/login   - real credential check (Task 3, replaces the dummy version)
 *   POST /auth/logout  - removes the session from Redis
 *   POST /auth/refresh - issues a fresh JWT (kept simple for now)
 *
 * Login flow:
 *   1. Look up the user by email via the User Service (not direct DB access)
 *   2. bcrypt.compare() the submitted password against the stored hash
 *   3. Sign a JWT
 *   4. Store the JWT in Redis, keyed by user id, with an expiry matching
 *      the token's own expiry — this lets us invalidate sessions early
 *      (e.g. on logout) and supports "log out of all devices" later.
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redis");
const { findUserByEmail } = require("../services/userServiceClient");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Redis session TTL in seconds — must match JWT_EXPIRES_IN.
// 7d = 7 * 24 * 60 * 60 seconds
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

// ─── POST /auth/login ──────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required.",
      });
    }

    // 1. Find the user via the User Service (owns the users table)
    const user = await findUserByEmail(email);

    if (!user) {
      // Same error message whether the email doesn't exist or the
      // password is wrong — never reveal which one it was (security
      // best practice, prevents email enumeration).
      return res.status(401).json({
        message: "Incorrect email or password.",
      });
    }

    // 2. Verify the password against the stored bcrypt hash
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Incorrect email or password.",
      });
    }

    // 3. Sign a JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Store the session in Redis — key format: session:<userId>
    // This allows us to check "is this token still valid?" independent
    // of the JWT's own signature check (e.g. after a forced logout).
    await redisClient.setEx(
      `session:${user.id}`,
      SESSION_TTL_SECONDS,
      token
    );

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(400).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    await redisClient.del(`session:${decoded.userId}`);

    return res.status(200).json({ message: "Logged out successfully." });
  } catch {
    // Even if the token is invalid/expired, logout should succeed
    // from the client's perspective — there's nothing left to clean up.
    return res.status(200).json({ message: "Logged out successfully." });
  }
});

// ─── POST /auth/refresh ────────────────────────────────────────────────────

router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Confirm the session is still active in Redis (not logged out elsewhere)
    const activeSession = await redisClient.get(`session:${decoded.userId}`);
    if (!activeSession) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await redisClient.setEx(
      `session:${decoded.userId}`,
      SESSION_TTL_SECONDS,
      newToken
    );

    return res.status(200).json({ token: newToken });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
});

module.exports = router;
