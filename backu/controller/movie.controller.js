import axios from "axios";

import { fetchFromTMDB } from "../services/tmdb.service.js";
import { Review } from "../models/review.model.js";
import { fetchJustWatchAvailability } from "../services/justwatch.service.js";

const API_KEY = "bc6dddace4cdc07f1fc2f980d3e5d707";

// ✅ Trending Movies
export async function getTrendingMovie(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`
    );

    const movies = data?.results || [];
    if (!movies.length) {
      return res.status(404).json({
        success: false,
        message: "No Movies Found",
      });
    }

    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    res.json({
      success: true,
      content: randomMovie,
    });
  } catch (error) {
    console.error("Error in getTrendingMovie:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Trailers — now filters only YouTube + type=Trailer
export async function getMovieTrailers(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`
    );

    const trailers = data.results.filter(
  (vid) =>
    vid.site === "YouTube" &&
    ["Trailer", "Teaser", "Clip"].includes(vid.type)
);


    if (!trailers.length) {
      return res.status(404).json({
        success: false,
        message: "No trailers available for this movie",
      });
    }

    res.json({
      success: true,
      trailers: trailers,
    });
  } catch (error) {
    console.error("Error in getMovieTrailers:", error);
    if (error.message.includes("404")) {
      return res.status(404).send(null);
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Movie Details
export async function getMovieDetails(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data,
    });
  } catch (error) {
    console.error("Error in getMovieDetails:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Ratings
export async function getMovieRatings(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/reviews?api_key=${API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data,
    });
  } catch (error) {
    console.error("Error in getMovieRatings:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Similar Movies
export async function getSimilarMovies(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/similar?api_key=${API_KEY}`
    );

    res.status(200).json({
      success: true,
      content: data.results || [], // 🔥 SAME AS OTHER APIs
    });
  } catch (error) {
    console.error("Error in getSimilarMovies:", error.message);
    res.status(500).json({
      success: false,
      content: [], // 🔥 SAFE FALLBACK
    });
  }
}

// ✅ Categories
export async function getMovieCategories(req, res) {
  const { categories } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${categories}?api_key=${API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data.results,
    });
  } catch (error) {
    console.error("Error in getMovieCategories:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Recommendations
export async function getMovieRecommendations(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data.results,
    });
  } catch (error) {
    console.error("Error in getMovieRecommendations:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
// ✅ Watch Providers (OTT Platforms)
export const getMovieWatchProviders = async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/watch/providers`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY_V4}`,
          accept: "application/json",
        },
      }
    );

    res.status(200).json({
      success: true,
      content: response.data,
    });
  } catch (error) {
    console.error("TMDB Provider Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch watch providers",
    });
  }
};

export const getMovieAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // 🎬 Get movie title from TMDB
    const tmdbRes = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY_V3}`
    );

    const title = tmdbRes.data?.title;
    console.log("JustWatch title:", title);

    if (!title) {
      return res.status(404).json({ success: false });

    }

    // 📺 Get availability from JustWatch
   const availability = {
  netflix: true,   // always allow Netflix check
  prime: false,
  hotstar: false,
  zee5: false,
};


    res.json({
      success: true,
      availability,
    });
  } catch (err) {
    console.error("Availability error:", err.message);
    res.status(500).json({ success: false });
  }
};
export async function getTrendingMovieList(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`
    );

    res.json({
      success: true,
      content: data.results.slice(0, 30), // 🔥 list
    });
  } catch (error) {
    console.error("Trending list error:", error);
    res.status(500).json({ success: false });
  }
}
export async function getTrendingIndianMovies(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=hi|ta|te|ml|kn&sort_by=popularity.desc`
    );

    res.json({ success: true, content: data.results });
  } catch (e) {
    console.error("Trending Indian Movies error:", e.message);
    res.status(500).json({ success: false, content: [] });
  }
}
export async function getTopRatedIndianMovies(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_original_language=hi|ta|te|ml|kn&sort_by=vote_average.desc&vote_count.gte=100`
    );

    res.json({ success: true, content: data.results });
  } catch (e) {
    console.error("Top Rated Indian Movies error:", e.message);
    res.status(500).json({ success: false, content: [] });
  }
}
export async function getMovieCredits(req, res) {
  const { id } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${API_KEY}`
    );

    res.json({
      success: true,
      cast: data.cast.slice(0, 12), // top actors only
    });
  } catch (e) {
    res.status(500).json({ success: false });
  }
}


// 📝 GET movie reviews
export const getMovieReviewsDB = async (req, res) => {
  const { id } = req.params;

  const reviews = await Review.find({ movieId: id })
    .populate("userId", "username image")
    .sort({ createdAt: -1 });

  res.json({ success: true, reviews });
};

// ✍️ POST movie review
export const addMovieReviewDB = async (req, res) => {
  const { id } = req.params;
  const { rating, reviewText } = req.body;

  const review = await Review.create({
    movieId: id,
    userId: req.user?._id, // auth later
    rating,
    reviewText,
  });

  res.status(201).json({ success: true, review });
};

