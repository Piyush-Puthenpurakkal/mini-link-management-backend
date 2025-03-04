import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createLink,
  getUserLinks,
  updateLink,
  deleteLink,
} from "../controllers/linkController.js";

const router = express.Router();

router.post("/", protect, createLink);
router.get("/", protect, getUserLinks);
router.put("/:id", protect, updateLink);
router.delete("/:id", protect, deleteLink);

export default router;
