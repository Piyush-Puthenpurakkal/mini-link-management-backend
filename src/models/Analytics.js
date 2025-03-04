import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Link",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shopClicks: { type: Number, default: 0 },
    cta: { type: Number, default: 0 },
    platform: {
      type: String,
      enum: ["YouTube", "Instagram", "Facebook", "Other"],
      default: "Other",
      required: true,
    },
    uniqueVisitors: [
      {
        ipAddress: String,
        country: String,
        city: String,
        device: String,
        referrer: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Analytics", analyticsSchema);
