import { fetchFromTMDB } from "../services/tmdb.service.js";

const TMDB_API_KEY = "bc6dddace4cdc07f1fc2f980d3e5d707";

// ✅ Trending TV
export async function getTrendingTv(req, res) {
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}`
    );

    const randomTv = data.results[Math.floor(Math.random() * data.results?.length)];

    res.json({
      success: true,
      content: randomTv,
    });
  } catch (error) {
    console.error("Error in getTrendingTv:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Trailers
export async function getTvTrailers(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/videos?api_key=${TMDB_API_KEY}`
    );

    // filter only YouTube trailers
    const trailers = data.results.filter(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    );

    res.json({
      success: true,
      trailers, // 👈 changed from 'content' to 'trailers'
    });
  } catch (error) {
    if (error.message.includes("404")) return res.status(404).send(null);
    console.error("Error in getTvTrailers:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Details
export async function getTvDetails(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data,
    });
  } catch (error) {
    if (error.message.includes("404")) return res.status(404).send(null);
    console.error("Error in getTvDetails:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ Similar TV Shows
export async function getSimilarTvs(req, res) {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${id}/similar?api_key=${TMDB_API_KEY}`
    );
    res.status(200).json({
      success: true,
      similar: data.results, // 👈 match frontend expectation
    });
  } catch (error) {
    if (error.message.includes("404")) return res.status(404).send(null);
    console.error("Error in getSimilarTvs:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

// ✅ TV Categories
export async function getTvCategories(req, res) {
  const { categories } = req.params;
  try {
    const data = await fetchFromTMDB(
      `https://api.themoviedb.org/3/tv/${categories}?api_key=${TMDB_API_KEY}`
    );
    res.status(200).json({
      success: true,
      content: data.results,
    });
  } catch (error) {
    if (error.message.includes("404")) return res.status(404).send(null);
    console.error("Error in getTvCategories:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
