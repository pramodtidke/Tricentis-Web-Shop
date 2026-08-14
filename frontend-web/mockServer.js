// FILE: mockServer.js  (updated — fixes the 404 profile issue for any teammate)
//
// Simple mock backend server that mimics the Auth Service + User Service.
// Run with: node mockServer.js
//
// KEY FIX vs the Day 2 version: users who /auth/register are now stored in
// memory, so GET /users/:id/profile works for EVERY registered user, not
// just the one hardcoded seed user. This is why Person B was getting 404s —
// their registered user id didn't exist in a hardcoded array.

const http = require("http");

// Seed user so login still works out of the box with known credentials
const users = [
  {
    id: "usr_001",
    name: "Pawan Tidke",
    email: "pawan@example.com",
    password: "password123",
    createdAt: "2026-01-01T00:00:00.000Z",
    address: {
      street: "123 Main Street",
      city: "Pune",
      country: "India",
      postalCode: "411001",
    },
  },
];

let nextUserId = 2;

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── POST /auth/register ──
  if (req.method === "POST" && req.url === "/auth/register") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { name, email, password } = JSON.parse(body);

        if (users.find((u) => u.email === email)) {
          res.writeHead(409);
          res.end(JSON.stringify({ message: "An account with this email already exists." }));
          return;
        }

        const newUser = {
          id: "usr_" + String(nextUserId++).padStart(3, "0"),
          name,
          email,
          password,
          createdAt: new Date().toISOString(),
          address: null,
        };
        users.push(newUser);

        const token = "mock-jwt-token-" + Math.random().toString(36).slice(2);

        res.writeHead(201);
        res.end(
          JSON.stringify({
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
            token,
          })
        );
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Invalid request body." }));
      }
    });
    return;
  }

  // ── POST /auth/login ──
  if (req.method === "POST" && req.url === "/auth/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ message: "Incorrect email or password." }));
          return;
        }

        const token = "mock-jwt-token-" + Math.random().toString(36).slice(2);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            user: { id: user.id, name: user.name, email: user.email },
            token,
          })
        );
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Invalid request body." }));
      }
    });
    return;
  }

  // ── GET /users/:id/profile ──
  const profileMatch = req.url?.match(/^\/users\/([^/]+)\/profile$/);
  if (req.method === "GET" && profileMatch) {
    const userId = profileMatch[1];
    const user = users.find((u) => u.id === userId);

    if (!user) {
      res.writeHead(404);
      res.end(JSON.stringify({ message: "User not found." }));
      return;
    }

    res.writeHead(200);
    res.end(
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        address: user.address,
      })
    );
    return;
  }

  // ── 404 for everything else ──
  res.writeHead(404);
  res.end(JSON.stringify({ message: "Route not found." }));
});

server.listen(4000, () => {
  console.log("✅ Mock API server running at http://localhost:4000");
  console.log("   POST /auth/register");
  console.log("   POST /auth/login");
  console.log("   GET  /users/:id/profile");
  console.log("");
  console.log("   Seed login: pawan@example.com / password123");
});
