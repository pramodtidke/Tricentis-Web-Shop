/**
 * FILE: auth-service/src/services/userServiceClient.js
 *
 * Thin HTTP client the Auth Service uses to call the User Service
 * internally (service-to-service, NOT through the public API Gateway).
 *
 * Why the Auth Service doesn't touch PostgreSQL directly:
 * Per the System Design Doc, each microservice owns its own database
 * exclusively. The `users` table belongs to the User Service. The Auth
 * Service asks the User Service for the user record instead of querying
 * PostgreSQL itself — this keeps the services properly decoupled.
 */

const axios = require("axios");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3004";

/**
 * Looks up a user by email via the User Service's internal endpoint.
 * Returns the user record including password_hash (needed for bcrypt
 * comparison), or null if no user exists with that email.
 */
async function findUserByEmail(email) {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/users/internal/by-email/${encodeURIComponent(
        email.toLowerCase()
      )}`
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // no user with this email — not an error, just "not found"
    }
    // Any other failure (User Service down, network error, etc.) should
    // bubble up so the login route can return a proper 500 instead of
    // silently treating it as "wrong password."
    throw new Error(
      `User Service lookup failed: ${error.message}`
    );
  }
}

module.exports = { findUserByEmail };
