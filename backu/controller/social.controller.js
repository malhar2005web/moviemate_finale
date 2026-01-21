import { Friend } from "../models/friend.model.js";
import { SocialActivity } from "../models/socialActivity.model.js";

export const getFriendsFeed = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Get friend IDs
    const friends = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    });

    const friendIds = friends.map((f) =>
      f.userA.equals(userId) ? f.userB : f.userA
    );

    if (friendIds.length === 0) {
      return res.json({ success: true, feed: [] });
    }

    // 2️⃣ Time filter → last 3 days
    const since = new Date();
    since.setDate(since.getDate() - 3);

    // 3️⃣ Fetch activities
    const feed = await SocialActivity.find({
      userId: { $in: friendIds },
      action: { $in: ["WATCHED", "WATCHLIST"] },
      createdAt: { $gte: since },
    })
      .populate("userId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, feed });
  } catch (err) {
    console.error("FRIENDS FEED ERROR", err);
    res.status(500).json({ success: false });
  }
};
