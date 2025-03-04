import express from "express";
import Link from "../models/Link.js";
import { trackClickLogic } from "../controllers/analyticsController.js";

const router = express.Router();

// GET /r/:linkId
router.get("/:linkId", async (req, res) => {
  try {
    const { linkId } = req.params;

    // 1. Use trackClickLogic to increment link clicks & log analytics
    await trackClickLogic(req, linkId);

    // 2. Find the link again to get the final URL
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).send("Link not found");
    }

    // 3. Redirect to the final URL
    return res.redirect(link.url);
  } catch (error) {
    console.error("Redirect Error:", error);
    return res.status(500).send("Server Error");
  }
});

export default router;
