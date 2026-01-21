import { FriendRequest } from "../models/friendRequest.model.js";
import { Friend } from "../models/friend.model.js";
import { User } from "../models/user.model.js";

/* 📤 SEND FRIEND REQUEST — SUPPORTS USERNAME & AUTO-ACCEPT */
export const sendRequest = async (req, res) => {
  const fromUser = req.user._id;
  const { username } = req.body;

  try {
    // 🔍 Find target user by username
    const targetUser = await User.findOne({ username });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const toUser = targetUser._id;

    // 🚫 Self request is illegal
    if (fromUser.equals(toUser)) {
      return res.status(400).json({
        success: false,
        message: "You cannot add yourself",
      });
    }

    // 🔒 Already friends?
    const [userA, userB] = [fromUser, toUser].sort();
    const alreadyFriends = await Friend.findOne({ userA, userB });

    if (alreadyFriends) {
      return res.status(400).json({
        success: false,
        message: "Already friends",
      });
    }

    // 🔁 Check existing pending request
    const existing = await FriendRequest.findOne({
      fromUser,
      toUser,
      status: "PENDING",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    // 🔥 AUTO-ACCEPT ENABLED BY TARGET USER
    if (targetUser.autoAcceptFriends) {
      await Friend.create({ userA, userB });

      return res.json({
        success: true,
        autoAccepted: true,
        message: "Automatically accepted",
      });
    }

    // 🟡 NORMAL REQUEST FLOW
    await FriendRequest.create({
      fromUser,
      toUser,
      status: "PENDING",
    });

    return res.json({
      success: true,
      autoAccepted: false,
      message: "Friend request sent",
    });
  } catch (err) {
    console.log("FRIEND REQUEST ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Request failed",
    });
  }
};

/* 📥 ACCEPT FRIEND REQUEST */
export const acceptRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await FriendRequest.findById(requestId);

    if (!request || !request.toUser.equals(req.user._id)) {
      return res.status(403).json({ success: false });
    }

    request.status = "ACCEPTED";
    await request.save();

    const [userA, userB] = [request.fromUser, request.toUser].sort();

    await Friend.create({ userA, userB });

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ success: false });
  }
};

/* ❌ REJECT FRIEND REQUEST */
export const rejectRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    await FriendRequest.findByIdAndUpdate(requestId, {
      status: "REJECTED",
    });

    return res.json({ success: true });
  } catch {
    return res.status(400).json({ success: false });
  }
};

/* 👥 GET FRIENDS LIST */
export const getFriends = async (req, res) => {
  const userId = req.user._id;

  try {
    const friends = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    }).populate("userA userB", "username avatar");

    const list = friends.map((f) =>
      f.userA._id.equals(userId) ? f.userB : f.userA
    );

    return res.json({ success: true, friends: list });
  } catch {
    return res.status(400).json({ success: false });
  }
};
/* 📥 GET PENDING FRIEND REQUESTS (FOR RECEIVER) */
export const getRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      toUser: req.user._id,
      status: "PENDING",
    }).populate("fromUser", "username avatar");

    return res.json({
      success: true,
      requests,
    });
  } catch (err) {
    return res.status(400).json({ success: false });
  }
};
