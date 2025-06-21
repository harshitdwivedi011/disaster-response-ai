import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ReportForm = ({ refreshReports }) => {
  const [form, setForm] = useState({
    disaster_id: "",
    user_id: "",
    content: "",
    image_url: "",
  });

  const [disasters, setDisasters] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("disaster_updated", ({ type, data }) => {
      if (type === "create") {
        // Add new disaster to top of the list
        setDisasters((prev) => [data, ...prev]);
      } else if (type === "delete") {
        // Remove the deleted disaster
        setDisasters((prev) => prev.filter((d) => d.id !== data.id));
      } else if (type === "update") {
        setDisasters((prev) => prev.map((d) => (d.id === data.id ? data : d)));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch disasters once
  useEffect(() => {
    const fetchDisasters = async () => {
      try {
        const res = await fetch("http://localhost:5000/disasters/");
        const data = await res.json();
        setDisasters(data);
      } catch (err) {
        console.error("Failed to load disasters:", err);
      }
    };
    fetchDisasters();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Submit report to backend (with status = pending)
      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "netrunnerX", // or 'reliefAdmin'
        },
        body: JSON.stringify({
          ...form,
          verification_status: "pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return alert("Failed to submit: " + errorData.error);
      }

      const submittedReport = await response.json();

      // If there's an image URL, trigger Gemini verification
      if (form.image_url) {
        const verifyRes = await fetch(
          `http://localhost:5000/disasters/${form.disaster_id}/verify-image/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: form.image_url }),
          }
        );

        const data = await verifyRes.json();

        if (verifyRes.ok) {
          setVerificationStatus(data.geminiAnalysis || "Verified");

          // Update the report's verification status
          await fetch(
            `http://localhost:5000/api/reports/${submittedReport.id}/update-verification`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                verification_status: "Verified",
              }),
            }
          );
          alert(
            "Gemini Analysis:\n" + (data.geminiAnalysis || "No analysis found")
          );
        } else {
          alert("Image verification failed: " + data.error);
        }
      }

      // Refresh parent report list
      refreshReports?.();

      // Reset form
      setForm({
        disaster_id: "",
        user_id: "",
        content: "",
        image_url: "",
      });
      setVerificationStatus(null);
    } catch (err) {
      console.error("Submit error:", err.message);
      alert("Error submitting report: " + err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-4 rounded shadow"
    >
      <select
        name="disaster_id"
        value={form.disaster_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Disaster</option>
        {disasters.map((disaster) => (
          <option key={disaster.id} value={disaster.id}>
            {disaster.title}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="user_id"
        value={form.user_id}
        onChange={handleChange}
        placeholder="User ID (e.g., Citizen1)"
        className="w-full border p-2 rounded"
        required
      />

      <textarea
        name="content"
        value={form.content}
        onChange={handleChange}
        placeholder="Report content"
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="text"
        name="image_url"
        value={form.image_url}
        onChange={handleChange}
        placeholder="Image URL"
        className="w-full border p-2 rounded"
        required
      />

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Submit Report
      </button>

      {verificationStatus && (
        <div className="text-sm text-green-600 mt-2">
          Verified: {verificationStatus}
        </div>
      )}
    </form>
  );
};

export default ReportForm;
