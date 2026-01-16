// In ../controller/flickskyagent.js

import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MongoClient } from "mongodb";

// --- Constants ---
dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY_V3; 
const BASE_URL = "https://api.themoviedb.org/3";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "MOMA_db";

// --- GEMINI SETUP ---
let genAI;
let generativeModel;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  generativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
} else {
  console.warn("GEMINI_API_KEY not found. Chatbot will run in simple, non-AI mode.");
}

// --- Global Cache ---
let genreCache = {
  movie: new Map(),
  tv: new Map(),
};

/**
 * Helper function to get data from TMDb API.
 */
const getTmdbData = async (endpoint, params = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    params: {
      api_key: TMDB_API_KEY,
      ...params,
    },
  };
  try {
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    console.error(`Error fetching TMDb data from ${url}:`, error.message);
    return null;
  }
};

/**
 * Caches all available genres from TMDB.
 */
export const cacheGenres = async () => {
  if (genreCache.movie.size > 0) return;
  try {
    const movieData = await getTmdbData("/genre/movie/list");
    if (movieData && movieData.genres) {
      for (const g of movieData.genres) {
        genreCache.movie.set(g.name.toLowerCase(), g.id);
      }
    }
    console.log("Movie genres cached.");
  } catch (e) {
    console.error("Error caching genres:", e);
  }
};

/**
 * Finds a genre ID from the cached map.
 */
const findGenreId = (genreName) => {
  return genreCache.movie.get(genreName.toLowerCase().trim());
};

/**
 * Finds keyword IDs from TMDb
 */
const findKeywordIds = async (keywords = []) => {
  if (keywords.length === 0) return [];
  const keywordPromises = keywords.map(async (kw) => {
    const data = await getTmdbData("/search/keyword", { query: kw });
    return data?.results?.[0]?.id;
  });
  return (await Promise.all(keywordPromises)).filter(Boolean);
};

/**
 * --- UPDATED: Gets the YouTube trailer key for a movie (more robust) ---
 */
const getMovieTrailer = async (movieId) => {
  const data = await getTmdbData(`/movie/${movieId}/videos`);
  if (!data || !data.results || data.results.length === 0) return null;
  
  // 1. Try to find an official "Trailer"
  let trailer = data.results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
  
  // 2. If no trailer, try to find a "Teaser"
  if (!trailer) {
    trailer = data.results.find(
      (v) => v.site === "YouTube" && v.type === "Teaser"
    );
  }
  
  // 3. If still no, just grab the first YouTube video
  if (!trailer) {
    trailer = data.results.find(
      (v) => v.site === "YouTube"
    );
  }

  // 4. Return the key or null
  return trailer ? trailer.key : null;
};

/**
 * --- Gemini Chat Function ---
 */
const runGeminiChat = async (userInput) => {
  if (!generativeModel) {
    throw new Error("Gemini is not initialized.");
  }
  
  const prompt = `
    You are Flicksky, a friendly, helpful, and natural-sounding movie recommendation chatbot.
    Your job is to analyze the user's input and determine if it's a 'movie_request' or 'small_talk'.
    You must provide two things in a structured JSON format:
    1.  "explanation": Your natural, conversational reply to the user.
    2.  "type": EITHER 'movie_request' OR 'small_talk'.
    3.  "search": A JSON object with search terms. This object should be 'null' if the type is 'small_talk'.

    User's Request: "${userInput}"

    Here are your rules:
    -   If the user is making small talk (e.g., "hello", "how are you", "thanks"), respond conversationally and set type to 'small_talk' and search to 'null'.
    -   If the user is asking for a movie, fill out the search object and set type to 'movie_request'.
    -   If the user mentions a film industry (e.g., "Bollywood", "Indian"), use the 2-letter ISO 639-1 country code "IN" for "country_code".

    You MUST return ONLY a valid JSON object (no markdown, no other text).

    Example 1 (Movie Request): "horror comedy bollywood"
    {
      "explanation": "Okay, searching for Bollywood horror-comedies!",
      "search": {
        "genres": ["Horror", "Comedy"],
        "keywords": [],
        "title": "",
        "country_code": "IN"
      },
      "type": "movie_request"
    }

    Example 2 (Small Talk): "hello"
    {
      "explanation": "Hi there! What kind of movie are you in the mood for today?",
      "search": null,
      "type": "small_talk"
    }
    
    Now, analyze the user's request: "${userInput}"
  `;

  try {
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error in runGeminiChat:", error);
    throw new Error("Gemini failed to generate a response.");
  }
};

/**
 * --- UPDATED: Shared function to format movie lists ---
 * Now includes id, vote_average, and overview.
 */
const formatMovieSuggestions = async (movieResults) => {
  if (!movieResults || movieResults.length === 0) return [];
  
  // We don't need to fetch trailers here, we pass the full movie object
  // and the frontend will get what it needs.
  
  // Map the full movie objects to the data we need.
  const suggestionPromises = movieResults.slice(0, 5).map(async (movie) => {
    const trailerId = await getMovieTrailer(movie.id);
    return {
      id: movie.id,
      title: movie.title,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      overview: movie.overview,
      trailer: trailerId,
    };
  });
  return Promise.all(suggestionPromises);
};

/**
 * --- UPDATED: Advanced movie search ---
 * Now sorts by rating (vote_average) and ensures a minimum vote count.
 */
const findMoviesFromGeminiSearch = async (search) => {
  let data = null;
  
  if (search.title) {
    // Search by title doesn't allow sorting, which is fine
    data = await getTmdbData("/search/movie", { query: search.title });
  } 
  else if (search.genres?.length > 0 || search.keywords?.length > 0 || search.country_code) {
    const genreIds = search.genres ? search.genres.map(findGenreId).filter(Boolean) : [];
    const keywordIds = search.keywords ? await findKeywordIds(search.keywords) : [];
    
    const discoverParams = {
      with_genres: genreIds.join(','),
      with_keywords: keywordIds.join(','),
      // --- UPDATED SORTING ---
      sort_by: "vote_average.desc", // Sort by rating
      "vote_count.gte": 200, // At least 200 votes
    };
    
    if (search.country_code) {
      discoverParams.with_origin_country = search.country_code;
    }
    
    data = await getTmdbData("/discover/movie", discoverParams);
  }
  
  // Fallback: If no results from above, return popular movies
  if (!data || !data.results || data.results.length === 0) {
    data = await getTmdbData("/movie/popular");
  }

  return data.results;
};

/**
 * --- UPDATED: Fallback logic ---
 * Also sorts by rating now.
 */
const getSimpleRecommendations = async (userInput) => {
  let explanation = "";
  let data = null;
  const genreId = findGenreId(userInput);
  if (genreId) {
    explanation = `Okay, here are some popular ${userInput} movies!`;
    data = await getTmdbData("/discover/movie", {
      with_genres: genreId,
      // --- UPDATED SORTING ---
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
    });
  } else {
    explanation = `Here's what I found for '${userInput}':`;
    data = await getTmdbData("/search/movie", { query: userInput });
  }
  if (!data || !data.results || data.results.length === 0) {
    explanation = "Sorry, I couldn't find that. Check out these popular movies instead!";
    data = await getTmdbData("/movie/popular");
  }
  // formatMovieSuggestions now sends the full data
  const suggestions = await formatMovieSuggestions(data.results);
  return { explanation, suggestions };
};

/**
 * --- Function to save user input to MongoDB ---
 */
const saveInputToMongo = async (userInput) => {
  if (!MONGO_URI) {
    console.log("MONGO_URI not set, skipping save.");
    return;
  }
  
  let client;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    await db.collection("user_inputs").insertOne({
      input_text: userInput,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Error saving to MongoDB:", err.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

/**
 * --- UPDATED: Main Controller Function ---
 */
export const runFlickskyAgent = async (req, res) => {
  const { userInput } = req.body;
  if (!userInput) {
    return res.status(400).json({ success: false, error: "userInput is required" });
  }

  saveInputToMongo(userInput);
  
  if (genreCache.movie.size === 0) {
    await cacheGenres();
  }

  if (generativeModel) {
    try {
      const geminiResponse = await runGeminiChat(userInput);
      
      if (geminiResponse.type === "small_talk") {
        return res.json({
          success: true,
          agentResponse: {
            explanation: geminiResponse.explanation,
            suggestions: [], // No movie suggestions
          },
        });
      }
      
      const movieResults = await findMoviesFromGeminiSearch(geminiResponse.search);
      // Backend now sends full movie details
      const suggestions = await formatMovieSuggestions(movieResults); 

      let finalExplanation = geminiResponse.explanation;

      if (suggestions.length === 0) {
         finalExplanation = "Sorry, I couldn't find any exact matches for that. Here are some popular movies you might like!";
         // Manually get popular movies if search failed
         const popularResults = await getTmdbData("/movie/popular");
         const popularSuggestions = await formatMovieSuggestions(popularResults.results);
          return res.json({
            success: true,
            agentResponse: {
              explanation: finalExplanation,
              suggestions: popularSuggestions,
            },
          });
      }
      
      return res.json({
        success: true,
        agentResponse: {
          explanation: finalExplanation,
          suggestions: suggestions,
        },
      });

    } catch (geminiError) {
      console.error("Gemini-powered chat failed:", geminiError);
    }
  }

  // --- FALLBACK LOGIC ---
  console.log("Using fallback logic.");
  try {
    const agentResponse = await getSimpleRecommendations(userInput);
    return res.json({ success: true, agentResponse });
  } catch (error) {
    console.error("Fallback agent error:", error);
    return res.status(500).json({ success: false, error: "Fallback agent failed to run" });
  }
};