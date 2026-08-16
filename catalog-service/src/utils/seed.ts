import { Product } from "../models/Product";

const dummyProducts = [
  {
    id: "1",
    name: "Classic Leather Backpack",
    price: 89.99,
    description:
      "A durable, handcrafted leather backpack with a padded laptop compartment and adjustable straps.",
    category: "Bags",
    imageUrl: "https://placehold.co/600x600.png?text=Leather+Backpack",
  },
  {
    id: "2",
    name: "Wireless Noise-Cancelling Headphones",
    price: 199.99,
    description:
      "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
    category: "Electronics",
    imageUrl: "https://placehold.co/600x600.png?text=Headphones",
  },
  {
    id: "3",
    name: "Organic Cotton T-Shirt",
    price: 24.99,
    description:
      "Soft, breathable, sustainably sourced 100% organic cotton t-shirt.",
    category: "Apparel",
    imageUrl: "https://placehold.co/600x600.png?text=T-Shirt",
  },
  {
    id: "4",
    name: "Stainless Steel Water Bottle",
    price: 34.5,
    description:
      "Double-walled, vacuum-insulated bottle that keeps drinks cold for 24 hours or hot for 12.",
    category: "Accessories",
    imageUrl: "https://placehold.co/600x600.png?text=Water+Bottle",
  },
  {
    id: "5",
    name: "Smart Fitness Watch",
    price: 149.0,
    description:
      "Track your heart rate, sleep, and workouts with this water-resistant smart watch.",
    category: "Electronics",
    imageUrl: "https://placehold.co/600x600.png?text=Fitness+Watch",
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    const count = await Product.countDocuments();

    if (count === 0) {
      await Product.insertMany(dummyProducts);
      console.log(`✅ Seeded database with ${dummyProducts.length} products`);
    } else {
      console.log(`ℹ️  Database already has ${count} products, skipping seed`);
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
