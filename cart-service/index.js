require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("redis");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3005;

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

const cartKey = (userId) => `cart:${userId}`;

async function getCart(userId) {
  const raw = await redisClient.get(cartKey(userId));
  return raw ? JSON.parse(raw) : [];
}

async function saveCart(userId, cart) {
  await redisClient.set(cartKey(userId), JSON.stringify(cart));
}

app.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await getCart(userId);
    res.status(200).json({ userId, items: cart });
  } catch (err) {
    console.error("GET /cart error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/cart/:userId/items", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, name, price, quantity } = req.body;

    if (!productId || !name || price == null || !quantity) {
      return res.status(400).json({
        error: "productId, name, price, and quantity are required",
      });
    }

    const cart = await getCart(userId);
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, name, price, quantity });
    }

    await saveCart(userId, cart);
    res.status(200).json({ userId, items: cart });
  } catch (err) {
    console.error("POST /cart/add error:", err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

app.delete("/cart/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const cart = await getCart(userId);
    const updatedCart = cart.filter((item) => item.productId !== productId);
    await saveCart(userId, updatedCart);
    res.status(200).json({ userId, items: updatedCart });
  } catch (err) {
    console.error("DELETE /cart/remove error:", err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

// PATCH /cart/:userId/update — set exact quantity for an item
app.patch("/cart/:userId/update", async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity } = req.body;

    if (!productId || quantity == null) {
      return res.status(400).json({
        error: "productId and quantity are required",
      });
    }

    const cart = await getCart(userId);
    const item = cart.find((i) => i.productId === productId);

    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    if (quantity <= 0) {
      const updatedCart = cart.filter((i) => i.productId !== productId);
      await saveCart(userId, updatedCart);
      return res.status(200).json({ userId, items: updatedCart });
    }

    item.quantity = quantity;
    await saveCart(userId, cart);
    res.status(200).json({ userId, items: cart });
  } catch (err) {
    console.error("PATCH /cart/update error:", err);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

// DELETE /cart/:userId — clear the entire cart (used by Order Service after checkout)
app.delete("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await saveCart(userId, []);
    res.status(200).json({ userId, items: [] });
  } catch (err) {
    console.error("DELETE /cart error:", err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "cart-service" });
});

async function startServer() {
  await redisClient.connect();
  console.log("Connected to Redis");
  app.listen(PORT, () => console.log(`Cart Service running on port ${PORT}`));
}

startServer().catch((err) => {
  console.error("Failed to start Cart Service:", err);
  process.exit(1);
});

module.exports = app;
