import User from "../models/User.js";

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  const {
    username,
    email,
    bio,
    socialLinks,
    profileImage,
    bannerImage,
    backgroundColor,
  } = req.body;

  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profileImage = profileImage || user.profileImage;
    user.bannerImage = bannerImage || user.bannerImage;
    user.socialLinks = socialLinks || user.socialLinks;

    // Store background color in customization
    if (backgroundColor) {
      user.customization.backgroundColor = backgroundColor;
    }
    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
