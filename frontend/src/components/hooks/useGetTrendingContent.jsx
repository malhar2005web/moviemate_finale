import { useEffect, useState } from "react";
import { useContentStore } from "../../store/content.js";
import axios from "axios";

const useGetTrendingContent = () => {
  const [trendingContent, setTrendingContent] = useState(null); // Discover Daily
  const [charts, setCharts] = useState({}); // OTT-wise Top 3
  const [error, setError] = useState(null);

  const { contentType } = useContentStore();
  const normalizeProviderName = (name) => {
  const lower = name.toLowerCase();

  if (lower.includes("netflix")) return "Netflix";
  if (lower.includes("prime")) return "Amazon Prime Video";
  if (lower.includes("hotstar") || lower.includes("disney"))
    return "Disney+ Hotstar";
  if (lower.includes("jio")) return "JioCinema";
  if (lower.includes("zee")) return "Zee5";
  if (lower.includes("sony")) return "Sony LIV";

  return null;
};


  useEffect(() => {
    const fetchTrending = async () => {
      try {
        /* ------------------------------
           1️⃣ Discover Daily (single item)
        ------------------------------- */
        const heroRes = await axios.get(
          `/api/v1/${contentType}/trending`
        );

        const heroItem = heroRes.data?.content;
        if (!heroItem?.id) return;

        setTrendingContent(heroItem);

        /* ------------------------------
           2️⃣ Trending LIST (for charts)
        ------------------------------- */
        const listRes = await axios.get(
          `/api/v1/${contentType}/trending/list`
        );

        const list = listRes.data?.content || [];

        /* ------------------------------
           3️⃣ Group by OTT (Top 3)
        ------------------------------- */
        const ottMap = {};

        await Promise.all(
          list.slice(0, 25).map(async (item) => {
            try {
              const providerRes = await axios.get(
                `/api/v1/${contentType}/${item.id}/providers`
              );

              const results = providerRes.data?.content?.results || {};
const region = results.IN || results.US || results.GB;

if (!region) return;

// 🔥 flatrate + rent + buy (JustWatch-style)
const allProviders = [
  ...(region.flatrate || []),
  ...(region.rent || []),
  ...(region.buy || []),
];

allProviders.forEach((p) => {
  const ottName = normalizeProviderName(p.provider_name);
  if (!ottName) return;

  if (!ottMap[ottName]) ottMap[ottName] = [];
  if (ottMap[ottName].length < 5) {
    ottMap[ottName].push(item);
  }
});

            } catch {
              // ignore provider failures
            }
          })
        );

        setCharts(ottMap);
      } catch (err) {
        console.error("Trending fetch error:", err);
        setError(err.message);
      }
    };

    if (contentType) fetchTrending();
  }, [contentType]);

  return { trendingContent, charts, error };
};

export default useGetTrendingContent;
