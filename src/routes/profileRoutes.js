import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/customization", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(
      user.customization || {
        theme: "light",
        buttonStyle: "rounded",
        layout: "default",
        backgroundColor: "#FFFFFF",
      }
    );
  } catch (error) {
    console.error("Error fetching customization:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update Customization Settings
router.put("/customization", protect, async (req, res) => {
  try {
    const { theme, buttonStyle, layout, backgroundColor } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.customization.theme = theme || user.customization.theme;
    user.customization.buttonStyle =
      buttonStyle || user.customization.buttonStyle;
    user.customization.layout = layout || user.customization.layout;

    if (backgroundColor) {
      user.customization.backgroundColor = backgroundColor;
    }

    await user.save();

    res.json(user.customization);
  } catch (error) {
    console.error("Error updating customization:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
