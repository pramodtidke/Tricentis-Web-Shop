require("dotenv").config();
const { sequelize, Voucher } = require("./db");

const dummyVouchers = [
  { code: "WELCOME10", discountPercentage: 10, maxUses: 100, currentUses: 0, isActive: true },
  { code: "SAVE20", discountPercentage: 20, maxUses: 50, currentUses: 0, isActive: true },
  { code: "LIMITED5", discountPercentage: 50, maxUses: 1, currentUses: 0, isActive: true },
  { code: "EXPIRED", discountPercentage: 15, maxUses: 10, currentUses: 0, isActive: false },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (discount-service)");
    await sequelize.sync();

    const count = await Voucher.count();

    if (count === 0) {
      await Voucher.bulkCreate(dummyVouchers);
      console.log(`Seeded ${dummyVouchers.length} vouchers`);
    } else {
      console.log(`Vouchers table already has ${count} records, skipping seed`);
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await sequelize.close();
  }
}

seed();
