import express from "express";
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from "../controller/watchlist.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/add", protectRoute, addToWatchlist);
router.get("/get", protectRoute, getWatchlist);
router.delete("/remove/:movieId", protectRoute, removeFromWatchlist);

export default router;
