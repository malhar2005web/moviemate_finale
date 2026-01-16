import express from 'express';
import { getMovieCategories, getMovieDetails, getMovieRatings, getMovieRecommendations, getSimilarMovies, getTrendingMovie,getMovieWatchProviders } from '../controller/movie.controller.js';
import { getMovieTrailers } from '../controller/movie.controller.js';
const router = express.Router();
router.get("/trending",getTrendingMovie);
router.get("/:id/trailers",getMovieTrailers);
router.get("/:id/details",getMovieDetails);
router.get("/:id/ratings",getMovieRatings);
router.get("/:id/similar",getSimilarMovies);
router.get("/:id/recommendation",getMovieRecommendations);
router.get("/:categories",getMovieCategories);
router.get("/:id/providers",getMovieWatchProviders);

export default router;