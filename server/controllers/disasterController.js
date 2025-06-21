const axios = require("axios");
const cheerio = require("cheerio");
const supabase = require("../supabase");
const { getOrSetCache } = require("../utils/cache");
require("dotenv").config();

exports.createDisaster = async (req, res) => {
  try {
    const { title, location_name, description, tags, lat, lon, owner_id } =
      req.body;

    const auditEntry = {
      action: "create",
      user_id: owner_id,
      timestamp: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("disasters")
      .insert([
        {
          title,
          location_name,
          description,
          tags,
          owner_id,
          location: `POINT(${lon} ${lat})`,
          audit_trail: [auditEntry],
        },
      ])
      .select()
      .single();

    if (error) throw error;

    req.io.emit("disaster_updated", { type: "create", data });
    res.status(201).json(data);
  } catch (err) {
    console.error("Create disaster error:", err.message);
    res.status(500).json({ error: "Failed to create disaster" });
  }
};

exports.getDisasters = async (req, res) => {
  try {
    const tag = req.query.tag;
    let query = supabase
      .from("disaster_view")
      .select("*")
      .order("created_at", { ascending: false });

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch disasters error:", err.message);
    res.status(500).json({ error: "Failed to fetch disasters" });
  }
};

exports.updateDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const username = req.user?.username || "netrunnerX";

    const { data: existing, error: fetchErr } = await supabase
      .from("disasters")
      .select("audit_trail")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    const newAudit = {
      action: "update",
      user_id: username,
      timestamp: new Date().toISOString(),
    };

    const updatedTrail = [...(existing.audit_trail || []), newAudit];

    const { data, error } = await supabase
      .from("disasters")
      .update({ ...update, audit_trail: updatedTrail })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    req.io.emit("disaster_updated", { type: "update", data });
    res.json(data);
  } catch (err) {
    console.error("Update disaster error:", err.message);
    res.status(500).json({ error: "Failed to update disaster" });
  }
};

exports.deleteDisaster = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user?.username || "netrunnerX";

    // Fetch current audit trail first
    const { data: existing, error: fetchErr } = await supabase
      .from("disasters")
      .select("audit_trail")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    const auditEntry = {
      action: "delete",
      user_id: username,
      timestamp: new Date().toISOString(),
    };

    const updatedTrail = [...(existing.audit_trail || []), auditEntry];

    // Update audit_trail before deletion
    await supabase
      .from("disasters")
      .update({ audit_trail: updatedTrail })
      .eq("id", id);

    const { data, error } = await supabase
      .from("disasters")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    req.io.emit("disaster_updated", { type: "delete", data });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete disaster error:", err.message);
    res.status(500).json({ error: "Failed to delete disaster" });
  }
};

const activeEmitMap = new Map();
exports.getSocialMedia = async (req, res) => {
  const io = req.app.get("io");
  const { id: disasterId } = req.params;
  const cacheKey = `social_feed:${disasterId}`;
  try {
    // Use getOrSetCache to fetch or cache the mock posts
    const mockPosts = await getOrSetCache(cacheKey, async () => {
      return [
        {
          id: "post-1",
          text: "#floodrelief Need food in NYC",
          user: "citizen1",
          disasterId,
        },
        {
          id: "post-2",
          text: "Heavy rain in downtown area",
          user: "volunteer77",
          disasterId,
        },
        {
          id: "post-3",
          text: "#earthquake just hit downtown LA — buildings shaking!",
          user: "quakeWatcher",
          disasterId,
        },
        {
          id: "post-4",
          text: "Power outages reported in NYC due to the storm. #floodrelief",
          user: "citizenNYC",
          disasterId,
        },
      ];
    });

    res.json(mockPosts);

    if (!activeEmitMap.has(disasterId)) {
      mockPosts.forEach((post, i) => {
        setTimeout(() => io.emit("social_media_updated", post), i * 2000);
      });

      const timeout = setTimeout(() => {
        activeEmitMap.delete(disasterId);
      }, 10000); // allow re-emit after 10s

      activeEmitMap.set(disasterId, timeout);
    }
  } catch (err) {
    console.error("Social media fetch error:", err.message);
    res.status(500).json({ error: "Failed to load social media" });
  }
};

exports.getResourcesNearby = async (req, res) => {
  const { id } = req.params;
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  try {
    const cacheKey = `resources:${id}:${lat}:${lon}`;
    const resources = await getOrSetCache(cacheKey, async () => {
      const { data, error } = await supabase.rpc("nearby_resources", {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius_km: 10, // default 10 km radius
        disaster_id: id,
      });

      if (error) {
        console.error("Supabase RPC error:", error);
        return res.status(500).json({ error: error.message });
      }

      console.log(`Resource mapped: ${data.length} found for disaster ${id}`);

      return data;
    });
    res.json(resources);
  } catch (err) {
    console.error("Failed to fetch nearby resources: ", err.message);
    res.status(500).json({ error: "Failed to load resources" });
  }
};

exports.getOfficialUpdates = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get disaster info
    const { data: disaster, error } = await supabase
      .from("disasters")
      .select("title, description, tags")
      .eq("id", id)
      .single();

    if (error || !disaster) throw new Error("Disaster not found");

    // 2. Create unique keyword-based cache key
    const keywords = [
      ...(disaster.tags || []),
      ...disaster.title.split(" "),
      ...disaster.description.split(" "),
    ]
      .map((k) => k.toLowerCase())
      .filter((v) => !!v);

    const cacheKey = `official_updates:${[...new Set(keywords)]
      .sort()
      .join("_")}`;

    const updates = await getOrSetCache(cacheKey, async () => {
      const redCrossURL =
        "https://www.redcross.org/about-us/news-and-events.html";
      const response = await axios.get(redCrossURL);
      const $ = cheerio.load(response.data);

      const secondTeaser = $(".dynamic-page-teaser").eq(1);
      const updates = [];

      secondTeaser
        .find(".dynamic-page-teaser-items.row div.col-md-6")
        .each((i, el) => {
          const title = $(el).find(".title").text().trim();
          const date = $(el).find(".date").text().trim();
          const link =
            "https://www.redcross.org" + $(el).find("a").attr("href");

          const lowerTitle = title.toLowerCase();
          if (keywords.some((kw) => lowerTitle.includes(kw))) {
            updates.push({ title, date, link });
          }
        });

      return { updates };
    });

    res.json(updates);
  } catch (err) {
    console.error("Error scraping Red Cross:", err.message);
    res.status(500).json({ error: "Failed to fetch official updates" });
  }
};

exports.verifyImage = async (req, res) => {
  const { id } = req.params;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    const cacheKey = `verify:${id}:${imageUrl}`;
    const result = await getOrSetCache(cacheKey, async () => {
      const geminiRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: `Analyze image at ${imageUrl} for signs of manipulation or disaster context.`,
                },
              ],
            },
          ],
        },
        {
          params: { key: process.env.GEMINI_API_KEY },
        }
      );

      const output =
        geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No result";

      return {
        imageUrl,
        disasterId: id,
        verified: true,
        geminiAnalysis: output,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Gemini verify-image error:", err.message);
    res.status(500).json({ error: "Failed to verify image with Gemini" });
  }
};
