import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { updateSettings } from "../controller/user.controller.js";

const router = express.Router();

router.post("/settings", protectRoute, updateSettings);

export default router;
