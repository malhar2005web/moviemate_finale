import { getFriendsFeed } from "../controller/social.controller.js";
import protectRoute from "../middleware/protectRoute.js";
const router = express.Router();
router.get("/friends-feed", protectRoute, getFriendsFeed);
export default router;