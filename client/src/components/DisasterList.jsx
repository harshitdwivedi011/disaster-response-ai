import React, { useEffect, useState } from "react";
// import { io } from "socket.io-client";
import SocialFeed from "./SocialReports";
import OfficialUpdates from "./OfficialUpdates";

const DisasterList = ({
  disasters,
  fetchDisasters,
  filterTag,
  setFilterTag,
}) => {
  const [resourceMap, setResourceMap] = useState({});

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this disaster?"
    );
    if (!confirmed) return;
    await fetch(`http://localhost:5000/disasters/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user": "netrunnerX", // or 'reliefAdmin'
      },
    });
    fetchDisasters(filterTag);
  };
  const fetchResources = async (disasterId, lat, lon) => {
    try {
      const res = await fetch(
        `http://localhost:5000/disasters/${disasterId}/resources?lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      setResourceMap((prev) => ({ ...prev, [disasterId]: data }));
    } catch (err) {
      console.error("Failed to load resources:", err.message);
    }
  };

  const handleUpdate = async (id) => {
    const disaster = disasters.find((d) => d.id === id);
    const title = prompt("New title:", disaster.title);
    const location_name = prompt("New location name:", disaster.location_name);
    const description = prompt("New description:", disaster.description);
    const tags = prompt(
      "New tags (comma-separated):",
      disaster.tags?.join(", ")
    );

    if (!title || !location_name || !description) return;

    await fetch(`http://localhost:5000/disasters/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user": "netrunnerX", // or 'reliefAdmin'
      },
      body: JSON.stringify({
        title,
        location_name,
        description,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : disaster.tags,
      }),
    });

    fetchDisasters(filterTag);
  };
  useEffect(() => {
    disasters.forEach((disaster) => {
      if (
        disaster.location?.coordinates[0] &&
        disaster.location.coordinates[1] &&
        !resourceMap[disaster.id]
      ) {
        fetchResources(
          disaster.id,
          disaster.location.coordinates[1].toFixed(4),
          disaster.location.coordinates[0].toFixed(4)
        );
      }
    });
  }, [disasters]);

  return (
    <div className="space-y-4">
      {disasters.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Disasters</h2>
          <input
            type="text"
            placeholder="Filter by tag (e.g., flood)"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="border px-3 py-1 rounded w-full"
          />
          <button
            onClick={() => fetchDisasters(filterTag)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Apply Filter
          </button>
        </div>
      ) : (
        ""
      )}
      <div className="space-y-2">
        {disasters.map((disaster) => (
          <div key={disaster.id} className="border p-4 rounded bg-white shadow">
            <h3 className="text-lg font-semibold flex justify-between items-center">
              <span>{disaster.title}</span>
              {disaster.location?.coordinates && (
                <span className="text-sm text-gray-500 ml-2">
                  (Lat: {disaster.location.coordinates[1].toFixed(4)}, Lon:{" "}
                  {disaster.location.coordinates[0].toFixed(4)})
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600">{disaster.description}</p>
            <p className="text-sm text-gray-500 italic">
              Location: {disaster.location_name}
            </p>
            <p className="text-sm">Tags: {disaster.tags?.join(", ")}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleUpdate(disaster.id)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(disaster.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>

            <div className="mt-2 inline-block bg-blue-200 px-2 py-1 rounded">
              <h4 className="font-medium text-sm text-blue-600">
                Nearby Resources:
              </h4>
              {resourceMap[disaster.id]?.length > 0 ? (
                <ul className="list-disc ml-5 text-sm">
                  {resourceMap[disaster.id].map((res) => (
                    <li key={res.id}>
                      {res.name} ({res.type})<p>{res.location_name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic">
                  No Resources Mapped for this ID
                </p>
              )}
            </div>

            <OfficialUpdates disasterId={disaster.id} />

            <SocialFeed disasterId={disaster.id} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisasterList;
