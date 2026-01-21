import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { Trash } from "lucide-react";
import { SMALL_IMG_BASE_URL } from "../utils/constants";

const SeenPage = () => {
  const [seenList, setSeenList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Fetch seen list
  useEffect(() => {
    const fetchSeen = async () => {
      try {
        const res = await axios.get("/api/v1/social/seen");
        const activities = res.data.content || [];

        // hydrate with TMDB
        const detailed = await Promise.all(
          activities.map(async (item) => {
            try {
              const detailRes = await axios.get(
                `/api/v1/${item.contentType}/${item.contentId}/details`
              );

              return {
                ...detailRes.data.content,
                contentType: item.contentType,
                seenAt: item.updatedAt,
              };
            } catch {
              return null;
            }
          })
        );

        setSeenList(detailed.filter(Boolean));
      } catch (err) {
        console.error("Seen list error:", err);
        setSeenList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeen();
  }, []);

  // 2️⃣ Remove from seen
  const removeSeen = async (id) => {
    try {
      await axios.delete(`/api/v1/social/seen/${id}`);
      setSeenList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Remove seen failed", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <p className="text-center mt-20">Loading your watched list...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8">👁 Seen</h1>

        {seenList.length === 0 ? (
          <p className="text-gray-400">
            You haven’t marked anything as seen yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seenList.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 rounded-xl p-4 flex gap-4 items-center"
              >
                <Link to={`/watch/${item.id}`}>
                  <img
                    src={
                      item.poster_path
                        ? SMALL_IMG_BASE_URL + item.poster_path
                        : "/no-image.png"
                    }
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                </Link>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {item.title || item.name}
                  </h2>

                  <span
                    className={`inline-block mt-1 px-3 py-1 text-xs rounded-full ${
                      item.contentType === "movie"
                        ? "bg-red-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {item.contentType === "movie" ? "Movie" : "TV"}
                  </span>

                  <p className="text-sm text-gray-400 mt-2">
                    Seen on{" "}
                    {new Date(item.seenAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => removeSeen(item.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Remove from seen"
                >
                  <Trash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeenPage;
