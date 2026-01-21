import { useEffect, useRef, useState } from "react";
import { useContentStore } from "../store/content";
import axios from "axios";
import { Link } from "react-router-dom";
import { SMALL_IMG_BASE_URL } from "../utils/constants";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import useWatchlist from "./hooks/useWatchlist";

/* 🔥 SMART TITLES MAP */
const TITLES = {
  "regional-trending": "🔥 Regional Trending (India)",
  "top-rated-indian": "⭐ Top Rated Indian Movies",
  "top-rated-indian-tv": "📺 Top Rated Indian TV Shows",
  "Similar to Your Watchlist": "❤️ Similar to Your Watchlist",
  "Based on Your Activity": "❤️ Based on Your Activity",
};

const MovieSlider = ({ categories, items }) => {
  const { contentType } = useContentStore();
  const [content, setContent] = useState([]);
  const [showArrows, setShowArrows] = useState(false);
  const sliderRef = useRef(null);

  const {
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    ready,
  } = useWatchlist();

  // 🔥 FLAG FOR ACTIVITY ROW
  const isActivity = categories === "Based on Your Activity";

  /* 🔄 FETCH LOGIC */
  useEffect(() => {
    // 1️⃣ Direct items passed (watchlist / activity)
    if (items && items.length) {
      setContent(items);
      return;
    }

    if (!contentType || !categories) return;

    let endpoint = `/api/v1/${contentType}/${categories}`;

    if (categories === "top-rated-indian") {
      endpoint = `/api/v1/movie/top-rated-indian`;
    }

    if (categories === "regional-trending") {
      endpoint = `/api/v1/movie/trending-indian`;
    }

    if (categories === "top-rated-indian-tv") {
      endpoint = `/api/v1/tv/top-rated-indian`;
    }

    axios
      .get(endpoint)
      .then((res) => setContent(res.data.content || []))
      .catch(() => setContent([]));
  }, [contentType, categories, items]);

  /* ⭐ WATCHLIST TOGGLE */
  const toggleWatchlist = (item) => {
    const mediaType =
      item.media_type || (item.first_air_date ? "tv" : "movie");

    const poster =
      item.poster_path || item.backdrop_path || item.image || "";

    if (isInWatchlist(item.id)) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title || item.name,
        poster_path: poster,
        media_type: mediaType,
      });
    }
  };

  if (!content.length) return null;

  return (
    <div
      className="bg-black text-white relative px-5 md:px-20"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {/* 🧠 HEADING */}
      <h2 className="mb-4 text-2xl font-bold">
        {TITLES[categories] || categories.replaceAll("_", " ")}
      </h2>

      <div
        ref={sliderRef}
        className="flex space-x-4 overflow-x-scroll scrollbar-hide"
      >
        {content.map((item) => {
          const poster =
            item.backdrop_path ||
            item.poster_path ||
            item.image ||
            null;

          return (
            <div
              key={`${item.id}-${item.media_type || ""}`}
              className={`relative group ${
                isActivity ? "min-w-[160px]" : "min-w-[250px]"
              }`}
            >
              <Link to={`/watch/${item.id}`}>
                <div className="rounded-lg overflow-hidden">
                  {poster ? (
                    <img
                      src={SMALL_IMG_BASE_URL + poster}
                      className={`object-cover transition group-hover:scale-105 ${
                        isActivity
                          ? "h-[220px]"
                          : "h-[360px]"
                      }`}
                      alt={item.title || item.name}
                    />
                  ) : (
                    <div
                      className={`w-full bg-gray-700 flex items-center justify-center text-sm ${
                        isActivity
                          ? "h-[220px]"
                          : "h-[360px]"
                      }`}
                    >
                      No Image
                    </div>
                  )}
                </div>

                <p
                  className={`mt-2 text-center ${
                    isActivity ? "text-xs" : "text-sm"
                  }`}
                >
                  {item.title || item.name}
                </p>

                <p className="text-xs text-gray-400 text-center">
                  {item.first_air_date ? "TV Show" : "Movie"}
                </p>
              </Link>

              {/* 🔕 Optional: hide bookmark for activity row */}
              {ready && !isActivity && (
                <button
                  onClick={() => toggleWatchlist(item)}
                  className="absolute top-2 right-2 bg-black/70 p-2 rounded-full
                             opacity-0 group-hover:opacity-100 transition z-10"
                >
                  <Bookmark
                    className={`size-5 ${
                      isInWatchlist(item.id)
                        ? "fill-white text-white"
                        : "text-white"
                    }`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <button
            onClick={() =>
              sliderRef.current.scrollBy({
                left: -sliderRef.current.offsetWidth,
                behavior: "smooth",
              })
            }
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/60 p-3 rounded-full"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={() =>
              sliderRef.current.scrollBy({
                left: sliderRef.current.offsetWidth,
                behavior: "smooth",
              })
            }
            className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/60 p-3 rounded-full"
          >
            <ChevronRight />
          </button>
        </>
      )}
    </div>
  );
};

export default MovieSlider;
