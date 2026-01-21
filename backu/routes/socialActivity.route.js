import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  markAsWatched,
  markAsWatchlist,
    getSeenList,
    removeSeen,
} from "../controller/socialActivity.controller.js";

const router = express.Router();

router.post("/watched", protectRoute, markAsWatched);
router.post("/watchlist", protectRoute, markAsWatchlist);
router.get("/seen", protectRoute, getSeenList);
router.delete("/seen/:contentId", protectRoute, removeSeen);


export default router;
