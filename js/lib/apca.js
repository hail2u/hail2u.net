// https://github.com/Myndex/apca-w3#apca-w3-basic-math-srgb
const linearizeColorComponent = (val) => (val / 255.0) ** 2.4;

const clampLuminance = (luminance) => {
  const blkThrs = 0.022;
  const blkClmp = 1.414;

  if (luminance >= blkThrs) {
    return luminance;
  }

  return luminance + Math.abs(blkThrs - luminance) ** blkClmp;
};

const getLuminance = (color) => {
  const [red, green, blue] = color.match(/\d+/gu);
  const luminance =
    0.2126729 * linearizeColorComponent(red) +
    0.7151522 * linearizeColorComponent(green) +
    0.072175 * linearizeColorComponent(blue);
  return clampLuminance(luminance);
};

const getPerceptualContrast = (backgroundLuminance, foregroundLuminance) => {
  const deltaYmin = 0.0005;
  const scale = 1.14;

  if (Math.abs(backgroundLuminance - foregroundLuminance) < deltaYmin) {
    return 0.0;
  }

  if (backgroundLuminance > foregroundLuminance) {
    return (backgroundLuminance ** 0.56 - foregroundLuminance ** 0.57) * scale;
  }

  if (backgroundLuminance < foregroundLuminance) {
    return (backgroundLuminance ** 0.65 - foregroundLuminance ** 0.62) * scale;
  }

  return 0.0;
};

const scaleContrast = (contrast) => {
  const loClip = 0.1;
  const loConOffset = 0.027;

  const absContrast = Math.abs(contrast);

  if (absContrast < loClip) {
    return 0.0;
  }

  if (contrast > 0) {
    return contrast - loConOffset;
  }

  if (contrast < 0) {
    return contrast + loConOffset;
  }

  return 0.0;
};

const getContrastScore = (background, foreground) => {
  const backgroundLuminance = getLuminance(background);
  const foregroundLuminance = getLuminance(foreground);
  const contrast = getPerceptualContrast(
    backgroundLuminance,
    foregroundLuminance,
  );
  const scaled = scaleContrast(contrast);
  return (scaled * 100).toFixed(3);
};

export { getContrastScore };
