import express from "express";
import {
  searchMovie,
  searchPerson,
  searchTv,
} from "../controller/search.controller.js";
import {
  getSearchHistory,
  deleteSearchHistory,
} from "../controller/search.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/person/:query", searchPerson);
router.get("/movie/:query", searchMovie);
router.get("/tv/:query", searchTv);

// 🔥 ADD THESE
router.get("/history", protectRoute, getSearchHistory);
router.delete("/history/:id", protectRoute, deleteSearchHistory);

export default router;
