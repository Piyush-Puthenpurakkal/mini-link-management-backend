import Analytics from "../models/Analytics.js";
import Link from "../models/Link.js";

// Create a new link
export const createLink = async (req, res) => {
  const { title, url, description, type } = req.body;

  if (!title || !url || !type) {
    return res
      .status(400)
      .json({ message: "Title, URL, and Type are required" });
  }

  if (!["link", "shop"].includes(type)) {
    return res
      .status(400)
      .json({ message: "Invalid type. Must be 'link' or 'shop'." });
  }

  try {
    // Find the highest order value for the user's links
    const lastLink = await Link.findOne({ user: req.user.id }).sort({
      order: -1,
    });
    const newOrder = lastLink ? lastLink.order + 1 : 1;

    const link = new Link({
      user: req.user.id,
      title,
      url,
      description,
      type,
      order: newOrder, // Assign the next order value
    });

    await link.save();
    res.status(201).json({ message: "Link created successfully", link });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all links of a user (with optional filtering by type)
export const getUserLinks = async (req, res) => {
  try {
    const filter = { user: req.user.id };

    // Allow filtering by type if provided in the query
    if (req.query.type && ["link", "shop"].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const links = await Link.find(filter).sort({ order: 1 }).lean().exec();

    console.log("📢 Fetching Updated Links:", links);
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update a link
export const updateLink = async (req, res) => {
  const { title, url, description, order, type } = req.body;

  try {
    let link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found" });

    if (link.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Prevent invalid type updates
    if (type && !["link", "shop"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be 'link' or 'shop'." });
    }

    link.title = title || link.title;
    link.description = description || link.description;
    link.order = order !== undefined ? order : link.order;
    link.type = type || link.type;

    if (url && url !== link.url) {
      link.url = url;
      link.clicks = 0;
      await Analytics.updateOne(
        { linkId: link._id },
        { $set: { clicks: 0, shopClicks: 0, cta: 0 } },
        { upsert: true }
      );
    }
    await link.save();

    res.json({ message: "Link updated successfully", link });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete a link
export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found" });

    if (link.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await link.deleteOne();

    // ✅ Fix: Delete associated analytics
    await Analytics.deleteOne({ linkId: link._id });

    res.json({ message: "Link deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
