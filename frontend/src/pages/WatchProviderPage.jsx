import { useEffect, useState } from "react";
import axios from "axios";

// 🔗 Keyword-based OTT redirects
const getOTTLink = (providerName, title) => {
  if (!providerName || !title) return null;

  const name = providerName.toLowerCase();
  const q = encodeURIComponent(title);

  if (name.includes("netflix")) {
    return `https://www.netflix.com/search?q=${q}`;
  }

  if (name.includes("prime")) {
    return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${q}`;
  }

  if (name.includes("hotstar") || name.includes("disney")) {
    return `https://www.hotstar.com/in/search?q=${q}`;
  }

  if (name.includes("zee")) {
    return `https://www.zee5.com/search?q=${q}`;
  }

  if (name.includes("sony")) {
    return `https://www.sonyliv.com/search/${q}`;
  }

  if (name.includes("jiocinema") || name.includes("jio")) {
    return `https://www.jiocinema.com/search/${q}`;
  }

  return null;
};

const WatchProviderPage = ({ movieId, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [movieTitle, setMovieTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 🎬 Movie title
        const movieRes = await axios.get(
          `/api/v1/movie/${movieId}/details`
        );
        setMovieTitle(movieRes.data?.content?.title || "");

        // 📺 Providers (TMDB)
        const providerRes = await axios.get(
          `/api/v1/movie/${movieId}/providers`,
          { withCredentials: true }
        );

        const results = providerRes.data?.content?.results || {};
        const providerData =
          results.IN || results.US || results.GB || null;

        if (!providerData) {
          setProviders([]);
          return;
        }

        const STREAMING_PLATFORMS = [
          "netflix",
          "prime",
          "hotstar",
          "disney",
          "zee",
          "sony",
          "jiocinema",
        ];

        const allProviders = (providerData.flatrate || []).filter(
          (p) =>
            STREAMING_PLATFORMS.some((key) =>
              p.provider_name.toLowerCase().includes(key)
            )
        );

        setProviders(allProviders);
      } catch (err) {
        console.error("WatchProvider error:", err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  const handleOTTClick = (providerName) => {
    const link = getOTTLink(providerName, movieTitle);
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const handleNetflixCheck = () => {
    if (!movieTitle) return;
    window.open(
      `https://www.netflix.com/search?q=${encodeURIComponent(movieTitle)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 w-[380px] bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-center mb-4">
          Where to Watch
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">
            Finding OTT platforms…
          </p>
        ) : (
          <>
            {/* ✅ ALWAYS SHOW NETFLIX CHECK */}
            <button
              onClick={handleNetflixCheck}
              className="w-full mb-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition text-center"
            >
              Check on Netflix
            </button>

            {providers.length === 0 ? (
              <p className="text-center text-gray-400">
                Not available on other OTT platforms
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <button
                    key={provider.provider_id}
                    onClick={() =>
                      handleOTTClick(provider.provider_name)
                    }
                    className="flex flex-col items-center text-center hover:scale-105 transition cursor-pointer"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                      alt={provider.provider_name}
                      className="w-14 h-14 object-contain mb-1"
                    />
                    <p className="text-xs text-gray-300">
                      {provider.provider_name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WatchProviderPage;
