import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar.jsx";
import { Play, Video, Bookmark } from "lucide-react";
import useGetTrendingContent from "../../components/hooks/useGetTrendingContent.jsx";
import useWatchlist from "../../components/hooks/useWatchlist.jsx";
import {
  MOVIE_CATEGORIES,
  ORIGINAL_IMG_BASE_URL,
  TV_CATEGORIES,
} from "../../utils/constants";
import { useContentStore } from "../../store/content.js";
import MovieSlider from "../../components/MovieSlider.jsx";
import { useEffect, useState } from "react";

const HomeScreen = () => {
  const { trendingContent, charts } = useGetTrendingContent();
  const { contentType } = useContentStore();

  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } =
    useWatchlist();

  const [imgLoading, setImgLoading] = useState(true);
  const [similarFromWatchlist, setSimilarFromWatchlist] = useState([]);

  const [indianTrending, setIndianTrending] = useState([]);
  const [indianTopRated, setIndianTopRated] = useState([]);
  const [indianTv, setIndianTv] = useState([]);

  // 🔥 NEW: BASED ON ACTIVITY
  const [basedOnActivity, setBasedOnActivity] = useState([]);

  // 🆕🔥 NEW: FRIENDS FEED (WATCHED + WATCHLIST)
  const [friendsFeed, setFriendsFeed] = useState([]);

  /* FETCH SIMILAR FROM WATCHLIST */
  useEffect(() => {
    if (!watchlist || watchlist.length === 0) {
      setSimilarFromWatchlist([]);
      return;
    }

    const fetchSimilar = async () => {
      try {
        const limited = watchlist.slice(0, 4);

        const responses = await Promise.all(
          limited.map((item) =>
            axios.get(
              `/api/v1/${item.media_type || "movie"}/${item.id}/similar`
            )
          )
        );

        const merged = responses
          .flatMap((res) => res.data.content || [])
          .filter(
            (item, index, self) =>
              index === self.findIndex((i) => i.id === item.id)
          );

        setSimilarFromWatchlist(merged.slice(0, 20));
      } catch (err) {
        console.error("Similar from watchlist error:", err);
        setSimilarFromWatchlist([]);
      }
    };

    fetchSimilar();
  }, [watchlist]);

  /* 🔥 FETCH BASED ON ACTIVITY */
  useEffect(() => {
    axios
      .get("/api/v1/activity/basedOnActivity")
      .then((res) => setBasedOnActivity(res.data.content || []))
      .catch(() => setBasedOnActivity([]));
  }, []);

  /* 🆕🔥 FETCH FRIENDS FEED */
  useEffect(() => {
    axios
      .get("/api/v1/social/friends-feed")
      .then((res) => setFriendsFeed(res.data.feed || []))
      .catch(() => setFriendsFeed([]));
  }, []);

  /* FETCH INDIAN CONTENT */
  useEffect(() => {
    const loadIndian = async () => {
      try {
        const [trend, topRated, tv] = await Promise.all([
          axios.get("/api/v1/movie/trending-indian"),
          axios.get("/api/v1/movie/top-rated-indian"),
          axios.get("/api/v1/tv/top-rated-indian"),
        ]);

        setIndianTrending(trend.data.content || []);
        setIndianTopRated(topRated.data.content || []);
        setIndianTv(tv.data.content || []);
      } catch (err) {
        console.log("Indian sections error:", err);
      }
    };

    loadIndian();
  }, []);

  if (!trendingContent) {
    return (
      <div className="h-screen text-white relative">
        <Navbar />
        <div className="absolute inset-0 bg-black/70 shimmer" />
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <div className="relative min-h-[100vh] text-white overflow-hidden">
        <Navbar />

        {imgLoading && (
          <div className="absolute inset-0 bg-black/70 shimmer -z-10" />
        )}

        <img
          src={ORIGINAL_IMG_BASE_URL + trendingContent.backdrop_path}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover -z-20"
          onLoad={() => setImgLoading(false)}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent -z-10" />

        <div className="relative z-10 flex flex-col justify-center min-h-[100vh] px-8 md:px-16 lg:px-32">
          <span className="mb-3 inline-block w-fit rounded bg-white/10 px-3 py-1 text-sm">
            Discover Daily
          </span>

          <h1 className="text-5xl md:text-6xl font-bold max-w-2xl">
            {trendingContent.title || trendingContent.name}
          </h1>

          <p className="mt-3 text-lg opacity-80 max-w-xl">
            {trendingContent.overview?.slice(0, 160)}...
          </p>

          <div className="flex gap-4 mt-8">
            <Link
              to={`/watch/${trendingContent.id}`}
              className="bg-white text-black font-semibold py-3 px-6 rounded-md flex items-center"
            >
              <Play className="size-5 mr-2 fill-black" />
              Watch Trailer
            </Link>

            <Link
              to={`/watchProvider/${trendingContent.id}`}
              className="bg-white/10 backdrop-blur-md text-white py-3 px-6 rounded-md flex items-center"
            >
              <Video className="size-5 mr-2" />
              Where to Watch
            </Link>
          </div>
        </div>
      </div>

      {/* ❤️ BASED ON YOUR ACTIVITY */}
      {basedOnActivity.length > 0 && (
        <MovieSlider
          categories="Based on Your Activity"
          items={basedOnActivity}
        />
      )}

      {/* 🆕🔥 FRIENDS ARE WATCHING */}
      {friendsFeed.length > 0 && (
        <MovieSlider categories="Friends Are Watching" items={friendsFeed} />
      )}

      {/* SIMILAR TO WATCHLIST */}
      {similarFromWatchlist.length > 0 && (
        <MovieSlider
          categories="Similar to Your Watchlist"
          items={similarFromWatchlist}
        />
      )}

      {/* INDIAN SECTIONS */}
      {indianTrending.length > 0 && (
        <MovieSlider categories="Trending in India" items={indianTrending} />
      )}

      {indianTopRated.length > 0 && (
        <MovieSlider
          categories="Top Rated Indian Movies"
          items={indianTopRated}
        />
      )}

      {indianTv.length > 0 && (
        <MovieSlider
          categories="Top Rated Indian TV Shows"
          items={indianTv}
        />
      )}

      {/* STREAMING CHARTS */}
      {charts && Object.keys(charts).length > 0 && (
        <section className="bg-black px-8 md:px-16 lg:px-32 py-10">
          <h2 className="text-3xl font-bold text-white mb-8">
            Today’s Streaming Charts
          </h2>

          {Object.entries(charts).map(([ott, items]) => (
            <div key={ott} className="mb-10">
              <h3 className="text-xl font-semibold mb-4">{ott}</h3>

              <div className="flex gap-4 overflow-x-scroll scrollbar-hide pb-4">
                {items.slice(0, 5).map((item) => {
                  const saved = isInWatchlist(item.id);

                  return (
                    <div
                      key={item.id}
                      className="w-[160px] flex-shrink-0 relative"
                    >
                      <button
                        onClick={() =>
                          saved
                            ? removeFromWatchlist(item.id)
                            : addToWatchlist(item.id)
                        }
                        className="absolute top-2 left-2 z-10 bg-black/70 p-1 rounded"
                      >
                        <Bookmark
                          size={18}
                          className={
                            saved ? "fill-white text-white" : "text-white"
                          }
                        />
                      </button>

                      <Link to={`/watch/${item.id}`}>
                        <img
                          src={ORIGINAL_IMG_BASE_URL + item.poster_path}
                          alt={item.title || item.name}
                          className="w-full h-[240px] object-cover rounded-lg"
                        />
                        <p className="text-sm mt-1 text-white">
                          {item.title || item.name}
                        </p>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* CATEGORY SLIDERS */}
      <div className="flex flex-col gap-10 bg-black py-10">
        {contentType === "movie"
          ? MOVIE_CATEGORIES.map((cat) => (
              <MovieSlider key={cat} categories={cat} />
            ))
          : TV_CATEGORIES.map((cat) => (
              <MovieSlider key={cat} categories={cat} />
            ))}
      </div>
    </>
  );
};

export default HomeScreen;
