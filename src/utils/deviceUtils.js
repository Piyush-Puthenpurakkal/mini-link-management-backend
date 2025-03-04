export const getDeviceType = (userAgent) => {
  if (!userAgent) return "Unknown";
  if (/mobile/i.test(userAgent)) return "Mobile";
  if (/tablet/i.test(userAgent)) return "Tablet";
  return "Desktop";
};
