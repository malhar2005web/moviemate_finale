import { SocialActivity } from "../models/socialActivity.model.js";

export const markAsWatched = async (req, res) => {
  try {
    const { contentId, contentType } = req.body;
    const userId = req.user._id;

    if (!contentId || !contentType) {
      return res.status(400).json({ success: false });
    }

    await SocialActivity.findOneAndUpdate(
      { userId, contentId },
      {
        userId,
        contentId,
        contentType,
        action: "WATCHED",
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markAsWatched error:", err.message);
    res.status(500).json({ success: false });
  }
};

export const markAsWatchlist = async (req, res) => {
  try {
    const { contentId, contentType } = req.body;
    const userId = req.user._id;

    const existing = await SocialActivity.findOne({
      userId,
      contentId,
    });

    if (existing?.action === "WATCHED") {
      return res.status(200).json({ success: true });
    }

    await SocialActivity.findOneAndUpdate(
      { userId, contentId },
      {
        userId,
        contentId,
        contentType,
        action: "WATCHLIST",
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("markAsWatchlist error:", err.message);
    res.status(500).json({ success: false });
  }
};
export const getSeenList = async (req, res) => {
  const seen = await SocialActivity.find({
    userId: req.user._id,
    action: "WATCHED",
  }).sort({ updatedAt: -1 });

  res.json({ success: true, content: seen });
};

export const removeSeen = async (req, res) => {
  const { contentId } = req.params;

  await SocialActivity.deleteOne({
    userId: req.user._id,
    contentId: Number(contentId),
    action: "WATCHED",
  });

  res.json({ success: true });
};