import express from "express";
import {
  getTrendingTv,
  getTvCategories,
  getTvDetails,
  getTvTrailers,
  getSimilarTvs,
  getTopRatedIndianTv,
  getTvReviewsDB,
  addTvReviewDB,
  getTvRatings
} from "../controller/tv.controller.js";

const router = express.Router();

// ✅ STATIC FIRST
router.get("/trending", getTrendingTv);
router.get("/top-rated-indian", getTopRatedIndianTv);

// ✅ ID-BASED ROUTES
router.get("/:id/trailers", getTvTrailers);
router.get("/:id/details", getTvDetails);
router.get("/:id/similar", getSimilarTvs);
router.get("/:id/reviews-db", getTvReviewsDB);
router.post("/:id/reviews-db", addTvReviewDB);
router.get("/:id/reviews-tmdb", getTvRatings);
// ✅ DYNAMIC CATEGORY LAST
router.get("/:categories", getTvCategories);

export default router;
