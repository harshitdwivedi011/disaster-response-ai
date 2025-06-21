import React, { useEffect, useState } from "react";

const server_origin = import.meta.env.VITE_SERVER_ORIGIN;
const OfficialUpdates = ({ disasterId }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await fetch(
          `${server_origin}/disasters/${disasterId}/official-updates`
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
    <div className="bg-white pt-4 my-2 ps-2 rounded shadow py-2 space-y-4">
      <h2 className="font-medium text-lg underline">Official Updates From Red Cross</h2>
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
