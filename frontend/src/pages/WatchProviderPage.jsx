import { useEffect, useState } from "react";
import axios from "axios";

const WatchProviderPage = ({ movieId, onClose }) => {
  const [providers, setProviders] = useState([]);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `/api/v1/movie/${movieId}/providers`,
          { withCredentials: true }
        );

        const indiaData = res.data?.content?.results?.IN;

        if (!indiaData) {
          setProviders([]);
          return;
        }

        const allProviders = [
          ...(indiaData.flatrate || []),
          ...(indiaData.rent || []),
          ...(indiaData.buy || []),
        ];

        setProviders(allProviders);
        setLink(indiaData.link || "");
      } catch (error) {
        console.error("Failed to fetch providers:", error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [movieId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* MODAL */}
      <div className="relative z-10 w-[360px] bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-center mb-4">
          Where to Watch
        </h2>

        {loading ? (
          <p className="text-center text-gray-400">
            Finding OTT platforms…
          </p>
        ) : providers.length === 0 ? (
          <p className="text-center text-gray-400">
            Not available on any OTT platform in India
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {providers.map((provider) => (
                <div
                  key={provider.provider_id}
                  className="flex flex-col items-center text-center"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w200${provider.logo_path}`}
                    alt={provider.provider_name}
                    className="w-14 h-14 object-contain mb-1"
                  />
                  <p className="text-xs text-gray-300">
                    {provider.provider_name}
                  </p>
                </div>
              ))}
            </div>

            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 transition"
              >
                Open on OTT
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WatchProviderPage;
