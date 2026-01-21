import { fetchFromTMDB } from "../services/tmdb.service.js";
import { Review } from "../models/review.model.js";

const TMDB_API_KEY = "bc6dddace4cdc07f1fc2f980d3e5d707";

/* =====================================================
   🔥 TRENDING TV
===================================================== */
export async function getTrendingTv(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}`
    );

    const results = data?.results || [];
    const randomTv =
      results[Math.floor(Math.random() * results.length)];

    res.json({ success: true, content: randomTv });
  } catch (error) {
    console.error("Error in getTrendingTv:", error.message);
    res.status(500).json({ success: false });
  }
}

/* =====================================================
   🎬 TRAILERS
===================================================== */
export async function getTvTrailers(req, res) {
  const { id } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/videos?api_key=${TMDB_API_KEY}`
    );

    const trailers =
      data?.results?.filter(
        (v) =>
          v.site === "YouTube" &&
          ["Trailer", "Teaser", "Clip"].includes(v.type)
      ) || [];

    res.json({ success: true, trailers });
  } catch (error) {
    console.error("Error in getTvTrailers:", error.message);
    res.status(500).json({ success: false, trailers: [] });
  }
}

/* =====================================================
   📄 DETAILS
===================================================== */
export async function getTvDetails(req, res) {
  const { id } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`
    );

    res.json({ success: true, content: data });
  } catch (error) {
    console.error("Error in getTvDetails:", error.message);
    res.status(500).json({ success: false });
  }
}

/* =====================================================
   🔁 SIMILAR TV
===================================================== */
export async function getSimilarTvs(req, res) {
  const { id } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/similar?api_key=${TMDB_API_KEY}`
    );

    res.json({
      success: true,
      content: data?.results || [],
    });
  } catch (error) {
    console.error("Error in getSimilarTvs:", error.message);
    res.status(500).json({ success: false, content: [] });
  }
}

/* =====================================================
   📂 TV CATEGORIES
===================================================== */
export async function getTvCategories(req, res) {
  const { categories } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${categories}?api_key=${TMDB_API_KEY}`
    );

    res.json({ success: true, content: data?.results || [] });
  } catch (error) {
    console.error("Error in getTvCategories:", error.message);
    res.status(500).json({ success: false });
  }
}

/* =====================================================
   🇮🇳 TOP RATED INDIAN TV
===================================================== */
export async function getTopRatedIndianTv(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=hi|ta|te|ml|kn&sort_by=vote_average.desc&vote_count.gte=50`
    );

    res.json({ success: true, content: data?.results || [] });
  } catch (error) {
    console.error("Top Rated Indian TV error:", error.message);
    res.status(500).json({ success: false, content: [] });
  }
}

/* =====================================================
   ✍️ MOVIEMATE DB REVIEWS (TV)
===================================================== */
export const getTvReviewsDB = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ movieId: id })
      .populate("userId", "username image")
      .sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (error) {
    console.error("TV Reviews DB error:", error.message);
    res.status(500).json({ success: false, reviews: [] });
  }
};

export const addTvReviewDB = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    const review = await Review.create({
      movieId: id, // same schema field as movies
      userId: req.user?._id,
      rating,
      reviewText,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("Add TV review error:", error.message);
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   ⭐ OFFICIAL TMDB TV REVIEWS
===================================================== */
export async function getTvRatings(req, res) {
  try {
    const { id } = req.params;

    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/reviews?api_key=${TMDB_API_KEY}`
    );

    // IMPORTANT: results can be EMPTY (TMDB reality)
    res.json({
      success: true,
      content: data,
    });
  } catch (error) {
    console.error("Error in getTvRatings:", error.message);
    res.status(500).json({
      success: false,
      content: { results: [] },
    });
  }
}
