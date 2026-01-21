import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// 🚫 prevent duplicate requests
friendRequestSchema.index(
  { fromUser: 1, toUser: 1 },
  { unique: true }
);

export const FriendRequest = mongoose.model(
  "FriendRequest",
  friendRequestSchema
);
