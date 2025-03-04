import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["link", "shop"], required: true },
    platform: {
      type: String,
      enum: ["YouTube", "Instagram", "Facebook", "Other"],
      default: "Other",
    },
    active: { type: Boolean, default: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Auto-detect platform before saving a NEW link
linkSchema.pre("save", function (next) {
  if (!this.platform || this.platform === "Other") {
    if (this.url.includes("youtube.com") || this.url.includes("youtu.be")) {
      this.platform = "YouTube";
    } else if (this.url.includes("instagram.com")) {
      this.platform = "Instagram";
    } else if (this.url.includes("facebook.com")) {
      this.platform = "Facebook";
    } else {
      this.platform = "Other";
    }
  }
  next();
});

// ✅ Auto-detect platform before UPDATING an existing link
linkSchema.pre("findOneAndUpdate", function (next) {
  let update = this.getUpdate();
  if (update.url) {
    if (update.url.includes("youtube.com") || update.url.includes("youtu.be")) {
      update.platform = "YouTube";
    } else if (update.url.includes("instagram.com")) {
      update.platform = "Instagram";
    } else if (update.url.includes("facebook.com")) {
      update.platform = "Facebook";
    } else {
      update.platform = "Other";
    }
  }
  next();
});

// Optional: Enforce unique ordering per user
linkSchema.index({ user: 1, order: 1 }, { unique: true });

export default mongoose.model("Link", linkSchema);
