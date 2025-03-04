import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";
import Analytics from "../models/Analytics.js";
import geoip from "geoip-lite";
import { getDeviceType } from "../utils/deviceUtils.js";

export const trackClickLogic = async (req, linkId) => {
  // 1. Get IP, device info, etc.
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "Unknown";
  const geo = geoip.lookup(ip);
  const device = getDeviceType(req.headers["user-agent"]);
  const referrer = req.headers.referer || "Direct";

  // 2. Find the link
  const link = await Link.findById(linkId);
  if (!link) throw new Error("Link not found");

  // 3. Increment link’s clicks field
  await Link.findByIdAndUpdate(linkId, { $inc: { clicks: 1 } });

  // 4. Track analytics if you have an Analytics model
  let analytics = await Analytics.findOne({ linkId });
  if (!analytics) {
    analytics = new Analytics({
      linkId,
      userId: link.user,
      platform: link.platform || "Other",
      views: 0,
      clicks: 0,
      shopClicks: 0,
      cta: 0,
      uniqueVisitors: [],
    });
  } else if (!analytics.userId) {
    analytics.userId = link.user || (req.user && req.user.id);
  }

  // Distinguish shop vs link
  if (link.type === "shop") {
    analytics.shopClicks += 1;
  } else {
    analytics.clicks += 1;
  }

  // Record the visitor if not already present
  if (!analytics.uniqueVisitors.find((v) => v.ipAddress === ip)) {
    analytics.uniqueVisitors.push({
      ipAddress: ip,
      country: geo?.country || "Unknown",
      city: geo?.city || "Unknown",
      device,
      referrer,
      timestamp: new Date(),
    });
  }
  analytics.updatedAt = new Date();
  await analytics.save();
};

// ---------------------------
// Track View with Consistent Platform Detection
// ---------------------------
export const trackView = async (req, res) => {
  const { linkId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(linkId)) {
    return res.status(400).json({ message: "Invalid link ID" });
  }
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "Unknown";
  const geo = geoip.lookup(ip);
  const device = getDeviceType(req.headers["user-agent"]);
  const referrer = req.headers.referer || "Direct";

  try {
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Find existing analytics record for this link
    let analytics = await Analytics.findOne({ linkId: link._id });
    if (!analytics) {
      analytics = new Analytics({
        linkId: link._id,
        userId: link.user,
        platform: link.platform || "Other",
        views: 0,
        clicks: 0,
        shopClicks: 0,
        cta: 0,
        uniqueVisitors: [],
      });
    }

    analytics.views += 1;
    // Add this visitor only if their IP hasn't been recorded yet
    if (!analytics.uniqueVisitors.find((v) => v.ipAddress === ip)) {
      analytics.uniqueVisitors.push({
        ipAddress: ip,
        country: geo?.country || "Unknown",
        city: geo?.city || "Unknown",
        device,
        referrer,
        timestamp: new Date(),
      });
    }
    // Update the record’s timestamp so that aggregations based on recency work
    analytics.updatedAt = new Date();
    await analytics.save();
    res.status(200).json({ message: "View tracked successfully" });
  } catch (error) {
    console.error("Track View Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------
// Track Click with Consistent Platform Detection
// ---------------------------
export const trackClick = async (req, res) => {
  const { linkId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(linkId)) {
    return res.status(400).json({ message: "Invalid link ID" });
  }

  // Get client details
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "Unknown";
  const geo = geoip.lookup(ip);
  const device = getDeviceType(req.headers["user-agent"]);
  const referrer = req.headers.referer || "Direct";

  try {
    const link = await Link.findById(linkId);
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // ✅ Check if clicks were reset
    if (link.clicks === 0) {
      console.log(`🔄 Clicks were reset for link: ${link.title}`);
    }

    // 🔴 Add a log before updating clicks
    console.log(`Before update: ${link.title} - Clicks: ${link.clicks}`);

    // Increment the link's clicks field and return the updated document
    const updatedLink = await Link.findByIdAndUpdate(
      linkId,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!updatedLink) {
      return res.status(500).json({ message: "Click update failed" });
    }

    // 🔴 Log after update to verify changes
    console.log(
      `After update: ${updatedLink.title} - Clicks: ${updatedLink.clicks}`
    );

    let analytics = await Analytics.findOne({ linkId });
    if (!analytics) {
      // ✅ Fix: Create a new analytics document and save it
      analytics = new Analytics({
        linkId,
        userId: link.user,
        platform: link.platform || "Other",
        views: 0,
        clicks: 0,
        shopClicks: 0,
        cta: 0,
        uniqueVisitors: [],
      });
    }

    // ✅ Fix: Ensure correct click count is updated and saved
    if (link.type === "shop") {
      analytics.shopClicks += 1;
    } else {
      analytics.clicks += 1;
    }

    // Ensure platform is set
    if (!analytics.platform) {
      analytics.platform = link.platform || "Other";
    }

    // Record the unique visitor if not already present
    if (!analytics.uniqueVisitors.find((v) => v.ipAddress === ip)) {
      analytics.uniqueVisitors.push({
        ipAddress: ip,
        country: geo?.country || "Unknown",
        city: geo?.city || "Unknown",
        device,
        referrer,
        timestamp: new Date(),
      });
    }

    analytics.updatedAt = new Date();

    // ✅ Fix: Always save the analytics updates
    await analytics.save();

    res.status(200).json({
      message: "Click tracked successfully",
      updatedClicks: updatedLink.clicks,
    });
  } catch (error) {
    console.error("Track Click Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------------
// Get Analytics with Accurate Platform Stats and Traffic Per Link
// ---------------------------
export const getAnalytics = async (req, res) => {
  try {
    const endDate = req.query.end_date
      ? new Date(req.query.end_date)
      : new Date();
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : new Date(new Date().setMonth(endDate.getMonth() - 11));
    endDate.setHours(23, 59, 59, 999);

    // Base filter for the authenticated user and time range.
    const baseFilter = {
      userId: new mongoose.Types.ObjectId(req.user.id),
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // --- Monthly Views Aggregation ---
    // Sum up clicks, shopClicks, and CTA as totalVisits per month.
    const monthlyClicksAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalVisits: { $sum: { $add: ["$clicks", "$shopClicks", "$cta"] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build monthly array with zero-filling.
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const allMonths = [];
    let current = new Date(startDate);
    current.setDate(1);
    while (current <= endDate) {
      const monthLabel = `${
        monthNames[current.getMonth()]
      } ${current.getFullYear()}`;
      allMonths.push({ month: monthLabel, totalVisits: 0 });
      current.setMonth(current.getMonth() + 1);
    }
    monthlyClicksAggregation.forEach((item) => {
      const monthLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      const monthObj = allMonths.find((m) => m.month === monthLabel);
      if (monthObj) {
        monthObj.totalVisits = item.totalVisits;
      }
    });

    // --- Devices Aggregation ---
    // Unwind uniqueVisitors to group by device type.
    const devicesAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      { $unwind: "$uniqueVisitors" },
      { $group: { _id: "$uniqueVisitors.device", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: "$count" } },
    ]);

    // If no device data is found, provide default values.
    const devices =
      devicesAggregation.length > 0
        ? devicesAggregation
        : [
            { name: "Desktop", value: 0 },
            { name: "Mobile", value: 0 },
            { name: "Tablet", value: 0 },
          ];

    // --- Platform Stats Aggregation ---
    // Sum clicks, shopClicks, and CTA per platform into a single number.
    const platformStatsAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { $ifNull: ["$platform", "Other"] },
          totalClicks: { $sum: "$clicks" },
          totalShopClicks: { $sum: "$shopClicks" },
          totalCTA: { $sum: "$cta" },
        },
      },
    ]);
    const defaultPlatformStats = {
      YouTube: 0,
      Instagram: 0,
      Facebook: 0,
      Other: 0,
    };
    const platformStats = platformStatsAggregation.reduce((acc, stat) => {
      const platform = stat._id || "Other";
      acc[platform] =
        (stat.totalClicks || 0) +
        (stat.totalShopClicks || 0) +
        (stat.totalCTA || 0);
      return acc;
    }, defaultPlatformStats);

    // --- Traffic by Links Aggregation ---
    // Group analytics by linkId and combine clicks into a single value.
    const linkTrafficAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$linkId",
          totalClicks: { $sum: "$clicks" },
          totalShopClicks: { $sum: "$shopClicks" },
          totalCTA: { $sum: "$cta" },
        },
      },
      {
        $lookup: {
          from: "links",
          localField: "_id",
          foreignField: "_id",
          as: "linkDetails",
        },
      },
      { $unwind: "$linkDetails" },
      {
        $project: {
          _id: 0,
          name: "$linkDetails.title",
          value: { $add: ["$totalClicks", "$totalShopClicks", "$totalCTA"] },
        },
      },
      { $sort: { value: -1 } },
    ]);
    const links = linkTrafficAggregation;

    // --- Total Clicks, Shop Clicks, and CTA ---
    const totalClicks = allMonths.reduce(
      (sum, month) => sum + (month.totalVisits || 0),
      0
    );
    const shopClicksAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalShopClicks: { $sum: "$shopClicks" } } },
    ]);
    const shopClicks =
      shopClicksAggregation.length > 0
        ? shopClicksAggregation[0].totalShopClicks
        : 0;
    const ctaAggregation = await Analytics.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalCTA: { $sum: "$cta" } } },
    ]);
    const ctaClicks =
      ctaAggregation.length > 0 ? ctaAggregation[0].totalCTA : 0;

    const userData = await User.findById(req.user.id).select(
      "firstName lastName"
    );

    const userId = req.user.id;

    // ✅ Fetch updated analytics data
    const analytics = await Analytics.find({ userId }).lean().exec();

    console.log("📊 Updated Analytics:", analytics);

    // Return the response with keys matching frontend expectations.
    res.json({
      user: {
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      analytics,
      monthlyViews: allMonths, // For the line chart (array of { month, totalVisits })
      devices, // For the device pie/bar chart (array of { name, value })
      links, // For the traffic by links chart (array of { name, value })
      platformStats, // Object with platform keys and numeric totals
      totalClicks, // Overall total clicks
      shopClicks, // Total shop clicks
      cta: ctaClicks, // Total CTA clicks
    });
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
