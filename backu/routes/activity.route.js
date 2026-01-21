import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { logActivity,getBasedOnActivity } from "../controller/activity.controller.js";

const router = express.Router();

// 🔥 USER ACTIVITY TRACK
router.post("/", protectRoute, logActivity);
router.get("/basedOnActivity", protectRoute, getBasedOnActivity);

export default router;
