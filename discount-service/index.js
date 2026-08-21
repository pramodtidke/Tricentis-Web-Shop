const express = require("express");
const cors = require("cors");
const { sequelize } = require("./db");
const discountRoutes = require("./routes/discountRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3013;

app.use("/discounts", discountRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (discount-service)");
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Discount Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Discount Service:", error);
    process.exit(1);
  }
}

startServer();
