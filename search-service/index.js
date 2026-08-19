const express = require("express");
const cors = require("cors");
const { ensureIndex } = require("./es");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3011;

app.use("/search", searchRoutes);

async function startServer() {
  try {
    await ensureIndex();
    app.listen(PORT, () => {
      console.log(`Search Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Search Service:", error);
    process.exit(1);
  }
}

startServer();
