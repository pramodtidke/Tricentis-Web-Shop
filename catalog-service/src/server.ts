import express from "express";
import { connectDB } from "./config/db";
import { seedDatabase } from "./utils/seed";
import productsRouter from "./routes/products";

const app = express();
const PORT = process.env.PORT || 4001;

app.use(express.json());
app.use("/products", productsRouter);

async function startServer() {
  await connectDB();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Catalog Service running on port ${PORT}`);
  });
}

startServer();
