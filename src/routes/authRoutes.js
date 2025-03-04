import express from "express";
import {
  googleAuth,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/google", googleAuth);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update", protect, updateUser);
router.delete("/delete", protect, deleteUser);

export default router;
