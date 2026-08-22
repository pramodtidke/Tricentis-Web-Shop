const express = require("express");
const cors = require("cors");
const { sequelize } = require("./db");
const wishlistRoutes = require("./routes/wishlistRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3014;

app.use("/wishlist", wishlistRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected (wishlist-service)");
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Wishlist Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Wishlist Service:", error);
    process.exit(1);
  }
}

startServer();
