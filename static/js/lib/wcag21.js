// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
const getComponentLuminance = (color) => {
  const sRGB = color / 255;

  if (sRGB <= 0.03928) {
    return sRGB / 12.92;
  }

  return ((sRGB + 0.055) / 1.055) ** 2.4;
};

const getRelativeLuminance = ([red, green, blue]) =>
  0.2126 * getComponentLuminance(red) +
  0.7152 * getComponentLuminance(green) +
  0.0722 * getComponentLuminance(blue);

// https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
const getContrastRatio = (foreground, background) => {
  const backgroundLuminance = getRelativeLuminance(background.match(/\d+/gu));
  const foregroundLuminance = getRelativeLuminance(foreground.match(/\d+/gu));
  const lighter = Math.max(backgroundLuminance, foregroundLuminance);
  const darker = Math.min(backgroundLuminance, foregroundLuminance);
  return parseFloat((lighter + 0.05) / (darker + 0.05)).toFixed(3);
};

export { getContrastRatio };
