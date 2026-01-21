import { fetchFromTMDB } from "../services/tmdb.service.js";
import { User } from "../models/user.model.js";

/* 🔍 SEARCH PERSON */
export async function searchPerson(req, res) {
  const { query } = req.params;

  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/person?query=${query}`
    );

    if (!response?.results || response.results.length === 0) {
      return res.status(404).send(null);
    }

    // ❌ NO HISTORY SAVE HERE
    res.status(200).json({
      success: true,
      content: response.results,
    });
  } catch (error) {
    console.log("Error in searchPerson:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* 🎬 SEARCH MOVIE */
export async function searchMovie(req, res) {
  const { query } = req.params;

  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/movie?query=${query}`
    );

    if (!response?.results || response.results.length === 0) {
      return res.status(404).send(null);
    }

    // ❌ NO HISTORY SAVE HERE
    res.status(200).json({
      success: true,
      content: response.results,
    });
  } catch (error) {
    console.log("Error in searchMovie:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* 📺 SEARCH TV */
export async function searchTv(req, res) {
  const { query } = req.params;

  try {
    const response = await fetchFromTMDB(
      `https://api.themoviedb.org/3/search/tv?query=${query}`
    );

    if (!response?.results || response.results.length === 0) {
      return res.status(404).send(null);
    }

    // ❌ NO HISTORY SAVE HERE
    res.status(200).json({
      success: true,
      content: response.results,
    });
  } catch (error) {
    console.log("Error in searchTv:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}


/* 📜 GET SEARCH HISTORY */
export async function getSearchHistory(req, res) {
  try {
    const user = await User.findById(req.user._id).select("searchHistory");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      content: user.searchHistory.reverse(), // recent first
    });
  } catch (error) {
    console.log("Error in getSearchHistory:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

/* 🗑️ DELETE SEARCH HISTORY ITEM */
export async function deleteSearchHistory(req, res) {
  try {
    const id = Number(req.params.id);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { searchHistory: { id } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      content: user.searchHistory,
    });
  } catch (error) {
    console.log("Error in deleteSearchHistory:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

