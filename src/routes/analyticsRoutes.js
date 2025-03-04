import express from "express";
import {
  trackView,
  trackClick,
  getAnalytics,
} from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/view/:linkId", protect, trackView);
router.post("/click/:linkId", protect, trackClick);
router.get("/:linkId", protect, getAnalytics);
router.get("/", protect, getAnalytics);

export default router;
