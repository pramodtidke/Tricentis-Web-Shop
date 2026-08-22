const express = require("express");
const { WishlistItem } = require("../db");

const router = express.Router();

// GET /wishlist/:userId — fetch all product IDs in a user's wishlist
router.get("/:userId", async (req, res) => {
  try {
    const items = await WishlistItem.findAll({
      where: { userId: req.params.userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      userId: req.params.userId,
      count: items.length,
      productIds: items.map((item) => item.productId),
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

// POST /wishlist/:userId/add — add a product to the wishlist
router.post("/:userId/add", async (req, res) => {
  try {
    const { productId } = req.body;
    const { userId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    const existing = await WishlistItem.findOne({
      where: { userId, productId },
    });

    if (existing) {
      return res.status(409).json({ error: "Product already in wishlist" });
    }

    const item = await WishlistItem.create({ userId, productId });

    res.status(201).json({
      message: "Product added to wishlist",
      id: item.id,
      userId: item.userId,
      productId: item.productId,
    });
  } catch (error) {
    // Race-condition fallback: two simultaneous adds could both pass the
    // findOne check above before either commits — the DB-level unique
    // constraint catches that case here.
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Product already in wishlist" });
    }
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Failed to add product to wishlist" });
  }
});

// DELETE /wishlist/:userId/remove/:productId — remove a product
router.delete("/:userId/remove/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const deleted = await WishlistItem.destroy({
      where: { userId, productId },
    });

    if (deleted === 0) {
      return res.status(404).json({ error: "Product not found in wishlist" });
    }

    res.status(200).json({
      message: "Product removed from wishlist",
      userId,
      productId,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Failed to remove product from wishlist" });
  }
});

module.exports = router;
