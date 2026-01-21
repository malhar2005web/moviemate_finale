import { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.withCredentials = true;

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [ready, setReady] = useState(false);

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get("/api/v1/watchlist/get");
      setWatchlist(res.data.content || []);
    } catch (err) {
      console.error("Watchlist fetch failed");
      setWatchlist([]);
    } finally {
      setReady(true);
    }
  };

  // 🔥 UPDATED: accepts FULL movie object
  const addToWatchlist = async (movie) => {
    await axios.post("/api/v1/watchlist/add", movie);
    fetchWatchlist();
  };

  const removeFromWatchlist = async (movieId) => {
    await axios.delete(`/api/v1/watchlist/remove/${movieId}`);
    fetchWatchlist();
  };

  const isInWatchlist = (movieId) =>
    watchlist.some((m) => m.id === movieId);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    ready,
  };
};

export default useWatchlist;
