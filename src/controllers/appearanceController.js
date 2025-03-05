import Appearance from "../models/Appearance.js";

// Fetch appearance settings
export const getAppearance = async (req, res) => {
  try {
    let appearance = await Appearance.findOne({ user: req.user.id });

    // Create default settings if none exist
    if (!appearance) {
      appearance = await Appearance.create({ user: req.user.id });
    }

    res.json(appearance);
  } catch (error) {
    console.error("Error fetching appearance:", error);
    res.status(500).json({ message: "Error fetching appearance settings" });
  }
};

// Update appearance settings
export const updateAppearance = async (req, res) => {
  try {
    const updateFields = {};
    const allowedFields = [
      "theme",
      "buttonStyle",
      "layout",
      "backgroundColor",
      "font",
      "fontColor",
      "buttonColor",
      "buttonFontColor",
    ];

    // Populate only the fields provided in the request
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const appearance = await Appearance.findOneAndUpdate(
      { user: req.user.id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    res.json({ message: "Appearance updated successfully", appearance });
  } catch (error) {
    console.error("Error updating appearance:", error);
    res.status(500).json({ message: "Error updating appearance settings" });
  }
};
