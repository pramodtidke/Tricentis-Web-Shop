/**
 * FILE: api-gateway/src/index.js
 *
 * ShopWave API Gateway. Runs on port 4000.
 *
 * The frontend talks to ONLY this Gateway — it has no knowledge of which
 * port any individual microservice runs on. The Gateway proxies each
 * request to the correct backend service based on the path prefix:
 *
 *   /auth/*      -> Auth Service     (http://localhost:3001)
 *   /users/*     -> User Service     (http://localhost:3004)
 *   /products/*  -> Catalog Service  (http://localhost:3002)  [Person B]
 *
 * If a target service is down or unreachable, the Gateway catches the
 * proxy error and returns a clean 502 Bad Gateway JSON response instead
 * of letting the connection hang or crash.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3004";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3005";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3006";

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
// Useful for confirming the Gateway itself is up, independent of any
// downstream service. Not proxied — handled directly here.

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "api-gateway" });
});

// ─── Shared error handler for every proxy route ───────────────────────────────
// Without this, http-proxy-middleware's default behavior on a connection
// failure (ECONNREFUSED) is to hang the request or return a raw HTML error
// page — neither is usable by the frontend's apiClient, which expects JSON.

function onProxyError(serviceName) {
  return (err, req, res) => {
    console.error(`❌ Proxy error reaching ${serviceName}:`, err.message || err);

    // res may sometimes be a raw socket rather than the full Express
    // response object — guard against that before calling .status()/.json()
    if (res.writeHead && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: `${serviceName} is currently unavailable. Please try again shortly.`,
          gateway: true,
        })
      );
    } else if (typeof res.end === "function") {
      res.end();
    }
  };
}

// ─── Proxy routes ───────────────────────────────────────────────────────────
// NOTE: pathRewrite is intentionally NOT used here — each downstream
// service expects the same path it would receive directly (e.g. the Auth
// Service's own route is POST /auth/login, so the full incoming path
// /auth/login is forwarded as-is). This keeps the Gateway a pure passthrough.

app.use(
  createProxyMiddleware({
    pathFilter: "/auth",
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Auth Service"),
    },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/users",
    target: USER_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("User Service"),
    },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/products",
    target: CATALOG_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Catalog Service"),
    },
  })
);


app.use(
  createProxyMiddleware({
    pathFilter: "/cart",
    target: CART_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Cart Service"),
    },
  })
);

app.use(
  createProxyMiddleware({
    pathFilter: "/orders",
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Order Service"),
    },
  })
);


// ─── 404 for anything not matching a known service prefix ────────────────────

app.use((req, res) => {
  res.status(404).json({
    message: `No route configured for ${req.method} ${req.path}.`,
  });
});

// ─── Startup ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ API Gateway running at http://localhost:${PORT}`);
  console.log(`   /auth/*      -> ${AUTH_SERVICE_URL}`);
  console.log(`   /users/*     -> ${USER_SERVICE_URL}`);
  console.log(`   /products/*  -> ${CATALOG_SERVICE_URL}`);
  console.log(`   /cart/*      -> ${CART_SERVICE_URL}`);
  console.log(`   /orders/*    -> ${ORDER_SERVICE_URL}`);
});
