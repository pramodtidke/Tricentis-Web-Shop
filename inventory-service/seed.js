require("dotenv").config();
const { sequelize, Inventory } = require("./db");

const dummyInventory = [
  { productId: "1", stockLevel: 50, reservedStock: 0 },
  { productId: "2", stockLevel: 25, reservedStock: 0 },
  { productId: "3", stockLevel: 100, reservedStock: 0 },
  { productId: "4", stockLevel: 15, reservedStock: 0 },
  { productId: "5", stockLevel: 8, reservedStock: 0 },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (inventory-service)");

    await sequelize.sync();

    const count = await Inventory.count();

    if (count === 0) {
      await Inventory.bulkCreate(dummyInventory);
      console.log(`Seeded ${dummyInventory.length} inventory records`);
    } else {
      console.log(`Inventory table already has ${count} records, skipping seed`);
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await sequelize.close();
  }
}

seed();
