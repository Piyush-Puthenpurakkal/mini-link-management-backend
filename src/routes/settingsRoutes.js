import express from "express";
import {
  getUserInfo,
  updateUserInfo,
  changePassword,
  deleteAccount,
} from "../controllers/settingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUserInfo);

router.put("/update", protect, updateUserInfo);

router.put("/change-password", protect, changePassword);

router.delete("/delete", protect, deleteAccount);

export default router;
