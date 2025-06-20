import React, { useEffect, useState } from "react";

const OfficialUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/disasters/official-updates`
        );
        const data = await res.json();
        setUpdates(data.updates || []);
      } catch (err) {
        console.error("Failed to fetch official updates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpdates();
  }, []);

  if (loading) return <p>Loading official updates...</p>;

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      {updates.length === 0 ? (
        <p>No official updates available.</p>
      ) : (
        updates.map((u, i) => (
          <div key={i} className="border-b pb-2">
            <p className="font-medium">{u.title}</p>
            <p className="text-sm text-gray-600">{u.date}</p>
            <a
              href={u.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm underline"
            >
              Read more
            </a>
          </div>
        ))
      )}
    </div>
  );
};

export default OfficialUpdates;
