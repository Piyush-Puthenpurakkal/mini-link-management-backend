import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAppearance,
  updateAppearance,
} from "../controllers/appearanceController.js";

const router = express.Router();

router.get("/", protect, getAppearance);
router.put("/", protect, updateAppearance);

export default router;
