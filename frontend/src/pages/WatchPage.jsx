import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContentStore } from "../store/content.js";
import axios from "axios";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactPlayer from "react-player";
import {
  ORIGINAL_IMG_BASE_URL,
  SMALL_IMG_BASE_URL,
} from "../utils/constants.js";
import { formatReleaseDate } from "../utils/dateFunction.js";
import WatchPageSkeleton from "../components/skeletons/WatchPageSkeleton";
import WatchProviderPage from "./WatchProviderPage";

const WatchPage = () => {
  const { id } = useParams();
  const { contentType } = useContentStore();

  const [trailers, setTrailers] = useState([]);
  const [content, setContent] = useState(null);
  const [similarContent, setSimilarContent] = useState([]);
  const [cast, setCast] = useState([]);
  const [tmdbReviews, setTmdbReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showProviders, setShowProviders] = useState(false);

  // 👁 Seen state
  const [isWatched, setIsWatched] = useState(false);
  const [markingSeen, setMarkingSeen] = useState(false);

  const sliderRef = useRef(null);
  const hasLoggedRef = useRef(false);

  /* 🎬 TRAILERS */
  useEffect(() => {
    if (!contentType || !id) return;
    axios
      .get(`/api/v1/${contentType}/${id}/trailers`)
      .then((res) => setTrailers(res.data.trailers || []))
      .catch(() => setTrailers([]));
  }, [contentType, id]);

  /* 📄 DETAILS */
  useEffect(() => {
    if (!contentType || !id) return;
    setLoading(true);
    axios
      .get(`/api/v1/${contentType}/${id}/details`)
      .then((res) => setContent(res.data.content))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [contentType, id]);

  /* 🔁 SIMILAR */
  useEffect(() => {
    if (!contentType || !id) return;
    axios
      .get(`/api/v1/${contentType}/${id}/similar`)
      .then((res) => setSimilarContent(res.data.content || []))
      .catch(() => setSimilarContent([]));
  }, [contentType, id]);

  /* 🎭 CAST */
  useEffect(() => {
    if (!contentType || !id) return;
    axios
      .get(`/api/v1/${contentType}/${id}/credits`)
      .then((res) => setCast(res.data.cast || []))
      .catch(() => setCast([]));
  }, [contentType, id]);

  /* 🗂️ TMDB REVIEWS */
  useEffect(() => {
    if (!contentType || !id) return;
    axios
      .get(`/api/v1/${contentType}/${id}/ratings`)
      .then((res) => setTmdbReviews(res.data.content?.results || []))
      .catch(() => setTmdbReviews([]));
  }, [contentType, id]);

  /* ✍️ USER REVIEWS */
  useEffect(() => {
    if (!contentType || !id) return;
    axios
      .get(`/api/v1/${contentType}/${id}/reviews-db`)
      .then((res) => setUserReviews(res.data.reviews || []))
      .catch(() => setUserReviews([]));
  }, [contentType, id]);

  /* 🧠 ACTIVITY LOG */
  useEffect(() => {
    if (!content || hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    axios.post("/api/v1/activity", {
      id: content.id,
      title: content.title || content.name,
      image: content.poster_path,
      type: contentType,
      action: "details_view",
    });
  }, [content, contentType]);

  /* 👁 MARK AS SEEN */
  const markAsSeen = async () => {
    if (!content || isWatched || markingSeen) return;

    try {
      setMarkingSeen(true);
      await axios.post("/api/v1/social/watched", {
        contentId: content.id,
        contentType,
      });
      setIsWatched(true);
    } catch {
      alert("Login required to mark as seen");
    } finally {
      setMarkingSeen(false);
    }
  };

  const avgUserRating =
    userReviews.length > 0
      ? (
          userReviews.reduce((a, r) => a + r.rating, 0) /
          userReviews.length
        ).toFixed(1)
      : null;

  const submitReview = async () => {
    if (!reviewText.trim()) return;
    try {
      setSubmitting(true);
      const res = await axios.post(
        `/api/v1/${contentType}/${id}/reviews-db`,
        { rating, reviewText }
      );
      setUserReviews([res.data.review, ...userReviews]);
      setReviewText("");
      setRating(5);
    } catch {
      alert("Login required to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({
      left: -sliderRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({
      left: sliderRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  if (loading) return <WatchPageSkeleton />;

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* 🎥 TRAILER */}
        <div className="aspect-video mb-10 px-2 sm:px-10 md:px-32">
          {trailers[0] && (
            <ReactPlayer
              controls
              width="100%"
              height="70vh"
              url={`https://www.youtube.com/watch?v=${trailers[0].key}`}
            />
          )}
        </div>

        {/* 👁 SEEN + OTT */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={markAsSeen}
            disabled={isWatched || markingSeen}
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition ${
              isWatched
                ? "bg-green-700 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isWatched ? "👁 Seen" : markingSeen ? "Marking..." : "👁 Mark as Seen"}
          </button>

          <button
            onClick={() => setShowProviders(true)}
            className="px-8 py-3 bg-red-600 rounded-xl font-semibold text-lg"
          >
            Watch on OTT
          </button>
        </div>

        {/* ⭐ RATINGS */}
        <div className="flex gap-10 justify-center text-lg mb-14">
          <div>
            ⭐ {content.vote_average?.toFixed(1)}{" "}
            <span className="text-gray-400">(TMDB)</span>
          </div>
          <div>
            👥 {avgUserRating || "—"}{" "}
            <span className="text-gray-400">(MovieMate)</span>
          </div>
        </div>

        {/* 📄 DETAILS */}
        <div className="flex flex-col md:flex-row gap-20 items-center mb-28">
          <div>
            <h2 className="text-5xl font-bold">
              {content.title || content.name}
            </h2>
            <p className="mt-2 text-gray-400">
              {formatReleaseDate(
                content.release_date || content.first_air_date
              )}
            </p>
            <p className="mt-4">{content.overview}</p>
          </div>

          <img
            src={ORIGINAL_IMG_BASE_URL + content.poster_path}
            className="max-h-[600px] rounded-2xl"
          />
        </div>

        {/* 🎭 CAST */}
        {cast.length > 0 && (
          <div className="max-w-7xl mx-auto mb-32">
            <h3 className="text-4xl font-bold mb-8">Cast</h3>
            <div className="flex gap-8 overflow-x-scroll scrollbar-hide pb-6">
              {cast.map((actor) => (
                <div key={actor.id} className="w-44 flex-none text-center">
                  <img
                    src={
                      actor.profile_path
                        ? SMALL_IMG_BASE_URL + actor.profile_path
                        : "/avatar.png"
                    }
                    className="h-60 rounded-2xl object-cover mb-3"
                  />
                  <p className="font-semibold">{actor.name}</p>
                  <p className="text-sm text-gray-400">
                    as {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✍️ COMMUNITY REVIEWS */}
        <div className="max-w-4xl mx-auto mb-32">
          <h3 className="text-4xl font-bold mb-6">Community Reviews</h3>

          <div className="bg-zinc-900 p-6 rounded-2xl mb-10">
            <select
              value={rating}
              onChange={(e) => setRating(+e.target.value)}
              className="bg-black p-2 rounded mb-3"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  ⭐ {n}
                </option>
              ))}
            </select>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full bg-black p-3 rounded mb-3"
              placeholder="Write your review..."
            />

            <button
              onClick={submitReview}
              disabled={submitting}
              className="bg-red-600 px-4 py-2 rounded"
            >
              {submitting ? "Posting..." : "Post Review"}
            </button>
          </div>

          {userReviews.map((r, i) => (
            <div key={i} className="bg-zinc-900 p-5 rounded-2xl mb-4">
              <p className="font-semibold">
                ⭐ {r.rating} • {r.userId?.username || "User"}
              </p>
              <p className="text-sm text-gray-400">
                {new Date(r.createdAt).toDateString()}
              </p>
              <p className="mt-2">{r.reviewText}</p>
            </div>
          ))}
        </div>

        {/* 🔁 SIMILAR */}
        {similarContent.length > 0 && (
          <div className="max-w-7xl mx-auto mb-36 relative">
            <h3 className="text-4xl font-bold mb-10">
              Similar {contentType === "tv" ? "TV Shows" : "Movies"}
            </h3>

            <div
              ref={sliderRef}
              className="flex gap-10 overflow-x-scroll scrollbar-hide pb-10 group"
            >
              {similarContent.map(
                (item) =>
                  item.poster_path && (
                    <Link
                      key={item.id}
                      to={`/watch/${item.id}`}
                      className="flex-none w-[300px] md:w-[340px]"
                    >
                      <img
                        src={ORIGINAL_IMG_BASE_URL + item.poster_path}
                        className="w-full h-[460px] object-cover rounded-3xl shadow-2xl hover:scale-105 transition"
                      />
                      <h4 className="mt-4 text-lg font-semibold line-clamp-1">
                        {item.title || item.name}
                      </h4>
                    </Link>
                  )
              )}

              <ChevronLeft
                onClick={scrollLeft}
                size={40}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100"
              />
              <ChevronRight
                onClick={scrollRight}
                size={40}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100"
              />
            </div>
          </div>
        )}

        {/* 🗂️ TMDB REVIEWS */}
        {tmdbReviews.length > 0 && (
          <div className="max-w-4xl mx-auto mb-24">
            <h3 className="text-2xl font-semibold mb-4">
              Popular Reviews (TMDB)
            </h3>

            <div className="max-h-[420px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {tmdbReviews.map((r) => (
                <div key={r.id} className="bg-zinc-900 p-5 rounded-xl">
                  <p className="font-semibold mb-1">{r.author}</p>
                  <p className="text-gray-300 text-sm whitespace-pre-line">
                    {r.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showProviders && (
        <WatchProviderPage
          movieId={id}
          onClose={() => setShowProviders(false)}
        />
      )}
    </div>
  );
};

export default WatchPage;
