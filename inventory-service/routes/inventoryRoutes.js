const express = require("express");
const { Inventory } = require("../db");

const router = express.Router();

router.get("/:productId", async (req, res) => {
  try {
    const record = await Inventory.findOne({
      where: { productId: req.params.productId },
    });

    if (!record) {
      return res.status(404).json({ error: "Product not found in inventory" });
    }

    const available = record.stockLevel - record.reservedStock;

    res.status(200).json({
      productId: record.productId,
      stockLevel: record.stockLevel,
      reservedStock: record.reservedStock,
      available,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.post("/reserve", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }

  const t = await Inventory.sequelize.transaction();

  try {
    const records = [];

    for (const { productId, quantity } of items) {
      const record = await Inventory.findOne({
        where: { productId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!record) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: `Product ${productId} not found in inventory` });
      }

      const available = record.stockLevel - record.reservedStock;

      if (available < quantity) {
        await t.rollback();
        return res.status(400).json({
          error: `Insufficient stock for ${productId}. Available: ${available}, requested: ${quantity}`,
        });
      }

      records.push({ record, quantity });
    }

    for (const { record, quantity } of records) {
      record.reservedStock += quantity;
      await record.save({ transaction: t });
    }

    await t.commit();

    res.status(200).json({
      message: "Stock reserved successfully",
      reserved: items,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error reserving stock:", error);
    res.status(500).json({ error: "Failed to reserve stock" });
  }
});

module.exports = router;
