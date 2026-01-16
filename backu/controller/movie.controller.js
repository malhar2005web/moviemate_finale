import { fetchFromTMDB } from "../services/tmdb.service.js";

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
      content: data.results,
    });
  } catch (error) {
    console.error("Error in getSimilarMovies:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
export async function getMovieWatchProviders(req, res) {
  const { id } = req.params;

  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/movie/${id}/watch/providers`
    );

    res.status(200).json({
      success: true,
      content: data,
    });
  } catch (error) {
    console.error("Error fetching watch providers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch watch providers",
    });
  }
}

