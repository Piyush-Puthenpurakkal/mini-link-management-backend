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

    // Ensure the URL includes a protocol
    let finalUrl = link.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "http://" + finalUrl;
    }

    // 3. Redirect to the final URL
    return res.redirect(finalUrl);
  } catch (error) {
    console.error("Redirect Error:", error);
    return res.status(500).send("Server Error");
  }
});

export default router;
