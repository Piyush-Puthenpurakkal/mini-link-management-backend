import User from "../models/User.js";
import Link from "../models/Link.js";
import Analytics from "../models/Analytics.js";
import bcrypt from "bcryptjs";

// Get user information
export const getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update user profile
export const updateUserInfo = async (req, res) => {
  const { firstName, lastName, email, password, name } = req.body;
  const userId = req.user.id;

  console.log("🔍 Received Update Request:", {
    userId,
    firstName,
    lastName,
    email,
    password,
    name, // Log name to debug
  });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists)
        return res.status(400).json({ message: "Email already in use" });
      user.email = email;
    }

    // Update firstName & lastName correctly
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Fallback: If `name` is sent as a full name
    if (name) {
      const nameParts = name.split(" ");
      user.firstName = nameParts[0];
      user.lastName = nameParts.slice(1).join(" ");
    }

    // If user provides a new password, hash & store it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    console.log("✅ Profile Updated:", user);
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("❌ Error Updating Profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  console.log("🔍 Password Change Request for User:", userId);
  console.log("Received Data from Frontend:", { currentPassword, newPassword });

  if (!currentPassword || !newPassword) {
    console.error("❌ Missing current or new password");
    return res
      .status(400)
      .json({ message: "Current and new password are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("🔍 Stored Hashed Password:", user.password);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("🔍 Password Match Result:", isMatch);

    if (!isMatch)
      return res.status(400).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    console.log("✅ Password Changed Successfully");
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error Changing Password:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete user account
export const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  console.log("🔍 Deleting Account for User:", userId);

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("🔍 Deleting user data...");
    await Promise.all([
      Link.deleteMany({ user: userId }),
      Analytics.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    console.log("✅ Account Deleted Successfully");
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("❌ Error Deleting Account:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
