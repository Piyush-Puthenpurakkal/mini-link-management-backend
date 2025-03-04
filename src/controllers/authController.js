import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// 🔹 Google Authentication
export const googleAuth = async (req, res) => {
  try {
    const { uid, email, name } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // Generate username from email
      const username = email.split("@")[0];

      // Create new user (no password required for OAuth)
      user = new User({
        uid,
        email,
        firstName: name?.split(" ")[0] || "Google",
        lastName: name?.split(" ")[1] || "User",
        username,
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token, user });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// 🔹 Register User
export const registerUser = async (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  try {
    let userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      token: generateToken(user),
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration Error: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user),
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Update User Profile
export const updateUser = async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    bio,
    profileImage,
    socialLinks,
  } = req.body;
  const userId = req.user.id; // Extract user ID from token

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update only if new values are provided
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.profileImage = profileImage || user.profileImage;
    user.socialLinks = socialLinks || user.socialLinks;

    await user.save();

    res.json({
      message: "User profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 🔹 Delete User
export const deleteUser = async (req, res) => {
  const userId = req.user.id; // Extract user ID from token

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
