const express = require("express");
const { client, INDEX_NAME } = require("../es");

const router = express.Router();

router.post("/index", async (req, res) => {
  try {
    const { id, name, description, category, price, imageUrl } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: "id and name are required" });
    }

    await client.index({
      index: INDEX_NAME,
      id,
      document: { id, name, description, category, price, imageUrl },
      refresh: "wait_for",
    });

    res.status(201).json({ message: "Product indexed successfully", id });
  } catch (error) {
    console.error("Error indexing product:", error);
    res.status(500).json({ error: "Failed to index product" });
  }
});

router.get("/", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const result = await client.search({
      index: INDEX_NAME,
      query: {
        multi_match: {
          query,
          fields: ["name^2", "description"],
          fuzziness: "AUTO",
        },
      },
    });

    const hits = result.hits.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    }));

    res.status(200).json({ query, count: hits.length, results: hits });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
