import mongoose from "mongoose";

const socialActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contentId: {
      type: Number,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    action: {
      type: String,
      enum: ["WATCHED", "WATCHLIST"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

socialActivitySchema.index(
  { userId: 1, contentId: 1 },
  { unique: true }
);

export const SocialActivity = mongoose.model(
  "SocialActivity",
  socialActivitySchema
);
