import dotenv from "dotenv";
dotenv.config({ path: new URL('../.env', import.meta.url) });

export const ENV_VARS={
    MONGO_URI:process.env.MONGO_URI,
    PORT:process.env.PORT||5000,
    JWT_SECRET:process.env.JWT_SECRET,
    NODE_ENV:process.env.NODE_ENV,
    TMDB_API_KEY:process.env.TMDB_API_KEY,
    GEMINI_API_KEY:process.env.GEMINI_API_KEY,
}
