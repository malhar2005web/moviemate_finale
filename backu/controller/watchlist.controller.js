import { User } from "../models/user.model.js";

export async function addToWatchlist(req, res) {
  const { id, title, poster_path, media_type } = req.body;

  try {
    const user = await User.findById(req.user._id);

    const exists = user.watchlist.some(
      (item) => item.id === id && item.media_type === media_type
    );

    if (exists) {
      return res.status(200).json({
        message: "Already in watchlist",
        content: user.watchlist,
      });
    }

    user.watchlist.push({
      id,
      title,
      image: poster_path,
      media_type,
      createdAt: new Date(),
    });

    await user.save();

    res.status(200).json({
      message: "Added to watchlist",
      content: user.watchlist,
    });
  } catch (err) {
    console.error("addToWatchlist error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getWatchlist(req, res) {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ content: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function removeFromWatchlist(req, res) {
  const movieId = Number(req.params.movieId);

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: { id: movieId } } },
      { new: true }
    );

    res.status(200).json({ content: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}
