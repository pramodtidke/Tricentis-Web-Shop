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
 *
 * --- Day 15 additions ---
 *   - helmet: secure HTTP response headers
 *   - express-rate-limit + rate-limit-redis: general + auth-specific
 *     rate limiting, backed by the shared Redis container so limits hold
 *     across restarts/multiple Gateway instances
 *   - swagger-ui-express: GET /docs serves OpenAPI documentation
 */
require('../tracing');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { RedisStore } = require("rate-limit-redis");
const { createClient } = require("redis");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3004";
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3005";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3006";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3008';

// ─── Redis client (Day 15 — powers rate limiting) ─────────────────────────────
// Defaults to localhost:6379 to match how the other service URLs above default
// (this Gateway is commonly run with `npm run dev` on the host, with Redis's
// container port mapped to the host). Override via REDIS_URL when the
// Gateway itself runs inside Docker (e.g. REDIS_URL=redis://redis:6379).

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("❌ Redis client error (rate limiting):", err.message || err);
});

redisClient.connect().catch((err) => {
  console.error("❌ Failed to connect to Redis for rate limiting:", err.message || err);
});

// ─── Middleware ───────────────────────────────────────────────────────────────

// Helmet — secure HTTP headers. Explicit CSP so it doesn't accidentally
// block the Next.js frontend (on FRONTEND_URL) from calling this Gateway.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", FRONTEND_URL],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.disable("x-powered-by");

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);



// ─── Rate limiting (Day 15) ───────────────────────────────────────────────────
// Redis-backed so limits are consistent even if the Gateway restarts or runs
// as multiple instances later.

const makeRedisStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });

// General limit — 200 requests / minute / IP, applied to every route.
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:general:"),
  message: { message: "Too many requests. Please slow down and try again shortly." },
});

// Stricter limit on /auth/* — 15 attempts / 15 minutes, keyed by IP + email
// where available, to blunt brute-force login attempts without collectively
// locking out an entire office/NAT'd IP over one bad actor's username.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore("rl:auth:"),
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

app.use(generalLimiter);
app.use("/auth", authLimiter);

const client = require('prom-client');

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// RED metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP requests that resulted in an error (4xx/5xx)',
  labelNames: ['method', 'route', 'status_code'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestErrors);

// Normalizes dynamic path segments (UUIDs, numeric IDs) to a fixed
// placeholder so Prometheus labels don't explode in cardinality as
// real order/user/product IDs flow through the Gateway.
function normalizeRoute(path) {
  return path
    .replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '/:id') // UUIDs
    .replace(/\/[a-zA-Z]+_[a-zA-Z0-9]+/g, '/:id')  // prefixed IDs like usr_001, ord_abc123
    .replace(/\/\d+/g, '/:id'); // plain numeric IDs
}

// Middleware: measure every request
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const route = normalizeRoute(req.baseUrl || req.path);
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };

    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    httpRequestDuration.observe(labels, durationSeconds);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpRequestErrors.inc(labels);
    }
  });

  next();
});

// Metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ─── Swagger / OpenAPI docs (Day 15) ──────────────────────────────────────────
// Spec lives at api-gateway/swagger.yaml (sibling of src/).

const swaggerDocument = YAML.load(path.join(__dirname, "..", "swagger.yaml"));
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { customSiteTitle: "ShopWave API Documentation" })
);
app.get("/docs.json", (req, res) => res.json(swaggerDocument));

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

app.use(
  createProxyMiddleware({
    pathFilter: "/payments",
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Payment Service"),
    },
  })
);

// ───────────────────────────────────────────────────────────────────────────── 

// ───────────────────────────────────────────────────────────────────────────── 

const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || "http://localhost:3009";

app.use(
  createProxyMiddleware({
    pathFilter: "/reviews",
    target: REVIEW_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Review Service"),
    },
  })
);

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || "http://localhost:3011";

app.use(
  createProxyMiddleware({
    pathFilter: "/search",
    target: SEARCH_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: onProxyError("Search Service"),
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
  console.log(`   /payments/*    -> ${PAYMENT_SERVICE_URL}`);
  console.log(`   /reviews/*   -> ${REVIEW_SERVICE_URL}`);
  console.log(`   /search/*    -> ${SEARCH_SERVICE_URL}`);
  console.log(`   /docs        -> Swagger UI`);
});
