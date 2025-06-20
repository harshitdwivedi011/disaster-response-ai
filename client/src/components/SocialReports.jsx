import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const SocialFeed = ({ disasterId }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    //  1. Fetch existing posts
    const fetchExistingPosts = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/disasters/${disasterId}/social-media`,
          {
            headers: {
              "x-user": "netrunnerX",
            },
          }
        );
        const data = await res.json();
        setPosts(data.reverse()); // newest at top
      } catch (err) {
        console.error("Failed to fetch existing posts:", err);
      }
    };

    fetchExistingPosts();

    // 2. Listen for real-time posts
    socket.on("social_media_updated", (post) => {
      if (post.disasterId === disasterId) {
        setPosts((prev) => [post, ...prev]);
      }
    });

    // 3. Clean up
    return () => socket.off("social_media_updated");
  }, [disasterId]);

  return (
    <div className="bg-white rounded p-4 shadow mt-4">
      <h2 className="text-lg font-bold mb-2">Live Social Media Feed</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {posts.map((post, i) => (
          <div
            key={`${post.id}-${i}`}
            className="border border-gray-200 p-2 rounded bg-gray-50"
          >
            <p className="text-sm">{post.text}</p>
            <p className="text-xs text-gray-500">— {post.user}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialFeed;
