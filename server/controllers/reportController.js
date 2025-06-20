const supabase = require("../supabase");

// Get all reports
exports.getReports = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Fetch reports error:", err.message);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { disaster_id, user_id, content, image_url, verification_status } =
      req.body;

    if (!disaster_id || !user_id || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("reports")
      .insert([
        {
          disaster_id,
          user_id,
          content,
          image_url: image_url || null,
          verification_status: verification_status || "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    req.io.emit("new_report", data);
    res.status(201).json(data);
  } catch (err) {
    console.error("Create report error:", err.message);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// Update report verification status
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verification_status } = req.body;

    const { data, error } = await supabase
      .from("reports")
      .update({
        verification_status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Update verification status error:", err.message);
    res.status(500).json({ error: "Failed to update verification status" });
  }
};
