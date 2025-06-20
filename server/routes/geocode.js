const express = require("express");
const axios = require("axios");
const router = express.Router();
const { getOrSetCache } = require("../utils/cache");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /geocode
router.post("/", async (req, res) => {
  const { location } = req.body;

  if (!location) {
    return res.status(400).json({ error: "Missing location text" });
  }

  const cacheKey = `geocode:${location.toLowerCase()}`;

  try {
    const result = await getOrSetCache(cacheKey, async () => {
      // 1. Gemini API → Extract clean location name
      const geminiRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          contents: [
            { parts: [{ text: `Extract location from: ${location}` }] },
          ],
        },
        {
          params: { key: GEMINI_API_KEY },
        }
      );

      const extracted =
        geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!extracted) throw new Error("Gemini did not return a location");

      console.log(extracted, "Extract");

      // 2. Use Nominatim to get coordinates
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        extracted
      )}&format=json&limit=1`;

      const nominatimRes = await axios.get(nominatimUrl, {
        headers: {
          "User-Agent": "DisasterResponseApp/1.0 (harshit110900@gmail.com)",
        },
      });

      const data = nominatimRes.data[0];
      if (!data) throw new Error("Location not found in OSM");

      return {
        original: location,
        extracted,
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon),
        mapLabel: data.display_name,
        source: "gemini+nominatim",
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Geocode error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to extract or locate address" });
  }
});

module.exports = router;
