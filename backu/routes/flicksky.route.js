import express from "express";
import { runFlickskyAgent } from "../controller/flickskyAgent.js";

const router = express.Router();

// This is the entire file.
// We just tell Express to use the "runFlickskyAgent" function
// to handle any POST requests to "/run-agent".
// The agent function itself (in the other file) will handle req, res, and all the logic.
router.post("/run-agent", runFlickskyAgent);

export default router;