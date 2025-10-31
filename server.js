const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const cors = require("cors");

const app = express();
const cache = new NodeCache({ stdTTL: 1800 }); // cache 30 min

app.use(cors());
app.use(express.static(__dirname));

app.get("/api/fetch", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  if (cache.has(url)) return res.json(cache.get(url));

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    const apps = Array.isArray(data)
      ? data
      : data.apps || data.data || data.list || [];

    const normalized = apps.map(app => ({
      name: app.name || app.title || "Unknown App",
      version: app.version || app.versionNumber || "N/A",
      description: app.description || app.desc || "No description available.",
      iconURL: app.iconURL || app.icon || app.image || "",
      downloadURL: app.downloadURL || app.url || app.download || "",
      date: app.date || app.updated || app.published || "",
      sourceURL: url
    }));

    cache.set(url, normalized);
    res.json(normalized);
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error.message);
    res.status(500).json({ error: "Failed to fetch repo." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Choco Library running on port ${PORT}`));
