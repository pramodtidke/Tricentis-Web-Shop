const express = require("express");
const { Voucher } = require("../db");

const router = express.Router();

// POST /discounts/validate
router.post("/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "code is required" });
    }

    const voucher = await Voucher.findOne({ where: { code } });

    if (!voucher) {
      return res.status(400).json({ error: "Invalid voucher code" });
    }

    if (!voucher.isActive) {
      return res.status(400).json({ error: "This voucher is no longer active" });
    }

    if (voucher.currentUses >= voucher.maxUses) {
      return res.status(400).json({ error: "This voucher has reached its usage limit" });
    }

    res.status(200).json({
      code: voucher.code,
      discountPercentage: voucher.discountPercentage,
      valid: true,
    });
  } catch (error) {
    console.error("Error validating voucher:", error);
    res.status(500).json({ error: "Failed to validate voucher" });
  }
});

// POST /discounts/redeem
router.post("/redeem", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  const t = await Voucher.sequelize.transaction();

  try {
    const voucher = await Voucher.findOne({
      where: { code },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!voucher) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid voucher code" });
    }

    if (!voucher.isActive) {
      await t.rollback();
      return res.status(400).json({ error: "This voucher is no longer active" });
    }

    if (voucher.currentUses >= voucher.maxUses) {
      await t.rollback();
      return res.status(400).json({ error: "This voucher has reached its usage limit" });
    }

    voucher.currentUses += 1;
    await voucher.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      message: "Voucher redeemed successfully",
      code: voucher.code,
      currentUses: voucher.currentUses,
      maxUses: voucher.maxUses,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error redeeming voucher:", error);
    res.status(500).json({ error: "Failed to redeem voucher" });
  }
});

module.exports = router;
