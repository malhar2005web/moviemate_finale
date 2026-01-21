export const updateSettings = async (req, res) => {
  const { autoAcceptFriends } = req.body;

  try {
    req.user.autoAcceptFriends = autoAcceptFriends;
    await req.user.save();

    res.json({
      success: true,
      autoAcceptFriends: req.user.autoAcceptFriends,
    });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};
