import express from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js"; // Multer setup
import User from "../models/User.js";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      ...user.toObject(),
      profileImage: user.profileImage
        ? `${req.protocol}://${req.get("host")}/${user.profileImage}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Upload Profile Image
router.post(
  "/upload-profile-image",
  protect,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      // Delete the old image if it exists
      if (user.profileImage && user.profileImage.startsWith("uploads/")) {
        fs.unlink(user.profileImage, (err) => {
          if (err) console.error("Error deleting old profile image:", err);
        });
      }

      // Save new image URL in DB
      user.profileImage = `uploads/${req.file.filename}`;
      await user.save();

      res.json({
        profileImage: `${req.protocol}://${req.get("host")}/${
          user.profileImage
        }`,
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.delete("/remove-profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete image from the filesystem if it exists
    if (user.profileImage && user.profileImage.startsWith("uploads/")) {
      const imagePath = path.join(process.cwd(), user.profileImage);

      // Ensure file exists before deleting
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove profile image reference from DB
    user.profileImage = "";
    await user.save();

    res.json({ message: "Profile image removed successfully" });
  } catch (error) {
    console.error("Error removing profile image:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
