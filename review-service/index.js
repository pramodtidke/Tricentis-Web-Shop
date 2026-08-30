const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3009;

app.use("/reviews", reviewRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "review-service" });
});

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Review Service running on port ${PORT}`);
  });
}

startServer();
