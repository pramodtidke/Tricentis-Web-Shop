require("dotenv").config();
const { sequelize, WishlistItem } = require("./db");

const dummyItems = [
  { userId: "user123", productId: "1" },
  { userId: "user123", productId: "3" },
  { userId: "user456", productId: "2" },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (wishlist-service)");
    await sequelize.sync();

    const count = await WishlistItem.count();

    if (count === 0) {
      await WishlistItem.bulkCreate(dummyItems);
      console.log(`Seeded ${dummyItems.length} wishlist items`);
    } else {
      console.log(`Wishlist table already has ${count} records, skipping seed`);
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await sequelize.close();
  }
}

seed();
