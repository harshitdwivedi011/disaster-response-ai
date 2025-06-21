import React, { useState } from "react";

const server_origin = import.meta.env.VITE_SERVER_ORIGIN;
const DisasterForm = ({ onSubmitSuccess }) => {
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    location_name: "",
    description: "",
    tags: [],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleChangeTag = (e) => {
    const input = e.target.value;
    setTagInput(input);

    const tagsArray = input
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    setForm((prev) => ({
      ...prev,
      tags: tagsArray,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Geocode location_name
      const geoRes = await fetch(`${server_origin}/geocode/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "netrunnerX", // or 'reliefAdmin'
        },
        body: JSON.stringify({ location: form.location_name }),
      });

      const geoData = await geoRes.json();

      if (!geoRes.ok) {
        throw new Error(geoData.error || "Geocoding failed");
      }

      // 2. Prepare final disaster payload
      const disasterPayload = {
        title: form.title,
        location_name: geoData.extracted || form.location_name,
        description: form.description,
        tags: form.tags,
        lat: geoData.lat,
        lon: geoData.lon,
        owner_id: "netrunnerX",
      };

      // 3. Submit to /disasters
      const response = await fetch(`${server_origin}/disasters/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "netrunnerX",
        },
        body: JSON.stringify(disasterPayload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Submission failed");
      }

      alert("Disaster submitted");
      setForm({ title: "", location_name: "", description: "", tags: [] });
      setTagInput("");
      onSubmitSuccess();
    } catch (error) {
      console.error("Submit error:", error.message);
      alert("Failed: " + error.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-4 rounded shadow"
    >
      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        name="location_name"
        value={form.location_name}
        onChange={handleChange}
        placeholder="Location name or description"
        className="w-full border p-2 rounded"
        required
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="text"
        name="tags"
        value={tagInput}
        onChange={handleChangeTag}
        placeholder="Tags (comma-separated)"
        className="w-full border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
};

export default DisasterForm;
