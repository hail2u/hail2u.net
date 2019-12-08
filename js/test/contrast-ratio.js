const testContrastRatio = () => {
  /* https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
  const getComponentLuminance = color => {
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

  /* https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio */
  const getContrast = element => {
    const style = getComputedStyle(element);
    const backgroundLuminance = getRelativeLuminance(style.backgroundColor.match(/\d+/g));
    const foregroundLuminance = getRelativeLuminance(style.color.match(/\d+/g));
    return (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
      (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
  };

  for (const color of document.querySelectorAll(".test-color li")) {
    const ratio = parseFloat(getContrast(color).toFixed(3));
    color.replaceChild(document.createTextNode(ratio), color.lastChild);
  }
};

window.addEventListener("load", testContrastRatio);
