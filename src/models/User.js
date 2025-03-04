import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: false, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.uid;
      },
    },
    uid: { type: String, unique: true, sparse: true },
    bio: { type: String, default: "" },
    customization: {
      theme: { type: String, default: "light" },
      buttonStyle: { type: String, default: "rounded" },
      layout: { type: String, default: "default" },
      backgroundColor: { type: String, default: "#FFFFFF" },
    },
    profileImage: { type: String, default: "" }, // URL to profile image
    bannerImage: { type: String, default: "" }, // URL to banner image
    socialLinks: {
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log("Entered Password:", enteredPassword);
  console.log("Hashed Password in DB:", this.password);

  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
