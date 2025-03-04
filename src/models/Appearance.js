import mongoose from "mongoose";

const appearanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    theme: { type: String, default: "air-snow" },
    buttonStyle: { type: String, default: "solid-rounded" },
    layout: { type: String, default: "stack" },
    backgroundColor: { type: String, default: "#FFFFFF" },
    font: { type: String, default: "DM Sans" },
    fontColor: { type: String, default: "#333333" },
    buttonColor: { type: String, default: "#ffffff" },
    buttonFontColor: { type: String, default: "#888888" },
  },
  { timestamps: true }
);

export default mongoose.model("Appearance", appearanceSchema);
