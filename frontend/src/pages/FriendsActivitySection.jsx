import { useEffect, useState } from "react";
import axios from "axios";
import { ORIGINAL_IMG_BASE_URL } from "../utils/constants";

const FriendsActivitySection = () => {
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    axios
      .get("/api/v1/social/friends-feed")
      .then((res) => setFeed(res.data.feed || []))
      .catch(() => setFeed([]));
  }, []);

  if (feed.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-14">
      <h3 className="text-3xl font-bold mb-6">
        👥 What your friends are watching
      </h3>

      <div className="space-y-4">
        {feed.map((item) => (
          <div
            key={item._id}
            className="bg-zinc-900 p-4 rounded-xl flex items-center gap-4"
          >
            {/* Avatar */}
            <img
              src={
                item.userId.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              className="h-10 w-10 rounded-full"
            />

            {/* Text */}
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">
                  {item.userId.username}
                </span>{" "}
                {item.action === "WATCHED"
                  ? "👁 watched"
                  : "⭐ added to watchlist"}
              </p>
              <p className="text-gray-400 text-sm">
                {item.title}
              </p>
            </div>

            {/* Poster */}
            {item.image && (
              <img
                src={ORIGINAL_IMG_BASE_URL + item.image}
                className="h-16 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsActivitySection;
