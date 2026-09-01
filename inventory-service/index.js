const express = require("express");
const cors = require("cors");
const { sequelize } = require("./db");
const inventoryRoutes = require("./routes/inventoryRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3007;

app.use("/inventory", inventoryRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (inventory-service)");
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Inventory Service:", error);
    process.exit(1);
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "inventory-service" });
});

startServer();
