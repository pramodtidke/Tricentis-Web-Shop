require("dotenv").config();
const { Client } = require("@elastic/elasticsearch");

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

const INDEX_NAME = "products";

async function ensureIndex() {
  const exists = await client.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    await client.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          id: { type: "keyword" },
          name: { type: "text" },
          description: { type: "text" },
          category: { type: "keyword" },
          price: { type: "float" },
          imageUrl: { type: "keyword" },
        },
      },
    });
    console.log(`Created Elasticsearch index: ${INDEX_NAME}`);
  }
}

module.exports = { client, INDEX_NAME, ensureIndex };
