import express from 'express';
import {
  getMovieCategories,
  getMovieDetails,
  getMovieRatings,
  getMovieRecommendations,
  getSimilarMovies,
  getTrendingMovie,
  getMovieWatchProviders,
  getMovieAvailability,
  getMovieTrailers,
  getTrendingMovieList,
  getTrendingIndianMovies,
  getTopRatedIndianMovies,
  getMovieCredits,
  getMovieReviewsDB,
  addMovieReviewDB

} from '../controller/movie.controller.js';

const router = express.Router();

// ✅ STATIC ROUTES FIRST
router.get("/trending", getTrendingMovie);
router.get("/trending-indian", getTrendingIndianMovies);
router.get("/top-rated-indian", getTopRatedIndianMovies);
router.get("/trending/list", getTrendingMovieList);

// ✅ ID ROUTES
router.get("/:id/trailers", getMovieTrailers);
router.get("/:id/details", getMovieDetails);
router.get("/:id/ratings", getMovieRatings);
router.get("/:id/similar", getSimilarMovies);
router.get("/:id/recommendation", getMovieRecommendations);
router.get("/:id/providers", getMovieWatchProviders);
router.get("/:id/availability", getMovieAvailability);
router.get("/:id/credits", getMovieCredits);
router.get("/:id/reviews-db", getMovieReviewsDB);
router.post("/:id/reviews-db", addMovieReviewDB);



// ✅ GENERIC LAST
router.get("/:categories", getMovieCategories);

export default router;
