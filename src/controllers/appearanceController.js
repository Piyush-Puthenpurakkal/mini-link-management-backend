import Appearance from "../models/Appearance.js";

// Fetch appearance settings
export const getAppearance = async (req, res) => {
  try {
    let appearance = await Appearance.findOne({ user: req.user.id });
    if (!appearance) {
      // Create a default appearance document if none exists
      appearance = new Appearance({ user: req.user.id });
      await appearance.save();
    }
    res.json(appearance);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateAppearance = async (req, res) => {
  const {
    theme,
    buttonStyle,
    layout,
    backgroundColor,
    font,
    fontColor,
    buttonColor,
    buttonFontColor,
  } = req.body;

  try {
    let appearance = await Appearance.findOne({ user: req.user.id });
    if (!appearance) {
      appearance = new Appearance({ user: req.user.id });
    }

    appearance.theme = theme || appearance.theme;
    appearance.buttonStyle = buttonStyle || appearance.buttonStyle;
    appearance.layout = layout || appearance.layout;
    if (backgroundColor) appearance.backgroundColor = backgroundColor;
    if (font) appearance.font = font;
    appearance.fontColor = fontColor || appearance.fontColor;
    if (buttonColor) appearance.buttonColor = buttonColor;
    if (buttonFontColor) appearance.buttonFontColor = buttonFontColor;

    await appearance.save();
    res.json({ message: "Appearance updated successfully", appearance });
  } catch (error) {
    console.error("Error updating appearance:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
