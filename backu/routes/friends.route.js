import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriends,
    getRequests
} from "../controller/friends.controller.js";

const router = express.Router();

router.post("/request", protectRoute, sendRequest);
router.post("/accept/:requestId", protectRoute, acceptRequest);
router.post("/reject/:requestId", protectRoute, rejectRequest);
router.get("/list", protectRoute, getFriends);
router.get("/requests", protectRoute, getRequests);


export default router;
