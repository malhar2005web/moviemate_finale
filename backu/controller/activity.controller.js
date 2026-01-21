import { User } from "../models/user.model.js";

export async function logActivity(req, res) {
  const { id, title, image, type, action } = req.body;

  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      searchHistory: {
        id,
        title,
        image,
        searchType: type,
        action,
        createdAt: new Date(),
      },
    },
  });

  res.sendStatus(200);
}
export async function getBasedOnActivity(req, res) {
  try {
    const user = await User.findById(req.user._id).select("searchHistory");

    if (!user || !user.searchHistory.length) {
      return res.status(200).json({ content: [] });
    }

    // weight system
    const weight = {
      details_view: 3,
      poster_click: 2,
    };

    const map = new Map();

    user.searchHistory.forEach((item) => {
      const score = weight[item.action] || 1;

      if (!map.has(item.id)) {
        map.set(item.id, { ...item, score });
      } else {
        map.get(item.id).score += score;
      }
    });

    const result = Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.status(200).json({ content: result });
  } catch (err) {
    console.log("Error in getBasedOnActivity:", err.message);
    res.status(500).json({ content: [] });
  }
}
