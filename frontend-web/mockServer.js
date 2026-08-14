// FILE: mockServer.js
// Simple mock backend server that mimics the Auth Service + User Service + Catalog Service
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

const products = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    price: 89.99,
    image: "https://placehold.co/600x600.png?text=Leather+Backpack",
    description:
      "A durable, handcrafted leather backpack with a padded laptop compartment and adjustable straps.",
  },
  {
    id: "2",
    name: "Wireless Noise-Cancelling Headphones",
    price: 199.99,
    image: "https://placehold.co/600x600.png?text=Headphones",
    description:
      "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    price: 24.99,
    image: "https://placehold.co/600x600.png?text=T-Shirt",
    description:
      "Soft, breathable, sustainably sourced 100% organic cotton t-shirt.",
  },
  {
    id: "4",
    name: "Stainless Steel Water Bottle",
    price: 34.5,
    image: "https://placehold.co/600x600.png?text=Water+Bottle",
    description:
      "Double-walled, vacuum-insulated bottle that keeps drinks cold for 24 hours or hot for 12.",
  },
  {
    id: "5",
    name: "Smart Fitness Watch",
    price: 149.0,
    image: "https://placehold.co/600x600.png?text=Fitness+Watch",
    description:
      "Track your heart rate, sleep, and workouts with this water-resistant smart watch.",
  },
  {
    id: "6",
    name: "Ceramic Pour-Over Coffee Set",
    price: 42.0,
    image: "https://placehold.co/600x600.png?text=Coffee+Set",
    description:
      "A minimalist ceramic pour-over dripper and matching mug set for slow-brewed coffee.",
  },
  {
    id: "7",
    name: "Running Shoes - Trail Edition",
    price: 119.99,
    image: "https://placehold.co/600x600.png?text=Trail+Shoes",
    description:
      "Lightweight trail running shoes with reinforced grip soles for all-terrain performance.",
  },
  {
    id: "8",
    name: "Minimalist Desk Lamp",
    price: 54.99,
    image: "https://placehold.co/600x600.png?text=Desk+Lamp",
    description:
      "An adjustable LED desk lamp with three brightness settings and a sleek aluminum body.",
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

  // ── GET /products ──
  if (req.method === "GET" && req.url === "/products") {
    res.writeHead(200);
    res.end(JSON.stringify(products));
    return;
  }

  // ── GET /products/:id ──
  const productMatch = req.url?.match(/^\/products\/([^/]+)$/);
  if (req.method === "GET" && productMatch) {
    const productId = productMatch[1];
    const product = products.find((p) => p.id === productId);

    if (!product) {
      res.writeHead(404);
      res.end(JSON.stringify({ message: "Product not found." }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(product));
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
  console.log("   GET  /products");
  console.log("   GET  /products/:id");
});