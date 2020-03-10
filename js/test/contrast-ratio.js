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
  const getContrast = (foreground, background) => {
    const backgroundLuminance = getRelativeLuminance(background.match(/\d+/g));
    const foregroundLuminance = getRelativeLuminance(foreground.match(/\d+/g));
    return (Math.max(backgroundLuminance, foregroundLuminance) + 0.05) /
      (Math.min(backgroundLuminance, foregroundLuminance) + 0.05);
  };

  for (const color of document.querySelectorAll(".test-color tbody td:first-child")) {
    const style = getComputedStyle(color);
    const foreground = style.color;
    const background = style.backgroundColor;
    const ratio = parseFloat(getContrast(foreground, background).toFixed(3));
    color.replaceChild(document.createTextNode(background), color.lastChild);
    const contrast = color.nextElementSibling;
    contrast.replaceChild(document.createTextNode(ratio), contrast.lastChild);
  }
};

window.addEventListener("load", testContrastRatio);
