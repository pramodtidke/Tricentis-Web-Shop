// FILE: mockServer.js
// Simple mock backend server that mimics the Auth Service + User Service
// Run with: node mockServer.js

const http = require("http");

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

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Expose-Headers", "Authorization");
  res.setHeader("Content-Type", "application/json");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── POST /auth/login ──
  if (req.method === "POST" && req.url === "/auth/login") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { email, password } = JSON.parse(body);
        const user = users.find(
          (u) => u.email === email && u.password === password
        );

        if (!user) {
          res.writeHead(401);
          res.end(JSON.stringify({ message: "Incorrect email or password." }));
          return;
        }

        const token = "mock-jwt-token-" + Math.random().toString(36).slice(2);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
            token: token,
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

// Run on port 4000 so it doesn't clash with Next.js on 3000
server.listen(4000, () => {
  console.log("✅ Mock API server running at http://localhost:4000");
  console.log("   POST /auth/login");
  console.log("   GET  /users/:id/profile");
});