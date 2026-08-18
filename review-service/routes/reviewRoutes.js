const express = require("express");
const Review = require("../models/Review");

const router = express.Router();

router.post("/:productId", async (req, res) => {
  try {
    const { userId, rating, comment } = req.body;

    if (!userId || !rating || !comment) {
      return res
        .status(400)
        .json({ error: "userId, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const review = await Review.create({
      productId: req.params.productId,
      userId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
    }).sort({ createdAt: -1 });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      productId: req.params.productId,
      count: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

module.exports = router;
