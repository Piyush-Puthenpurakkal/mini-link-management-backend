import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];

  console.log("🔍 Received Token:", token);

  if (!token) {
    console.error("❌ No token found in request");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token Decoded Successfully:", decoded);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      console.error("❌ User not found with this token");
      return res.status(401).json({ message: "User not found, invalid token" });
    }

    console.log("✅ Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
