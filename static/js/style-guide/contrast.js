/* Calculate contrast | MIT License */
import Color from "../lib/color.min.js";

const toRGB = (color) => {
  const c = new Color(color);
  return c.to("srgb");
};

const round = (decimal) => Math.round(decimal * 1000) / 1000;

window.addEventListener("load", () => {
  const queryColorTip = ".test-color > tbody > tr > td:nth-child(2) .test";
  const colorTips = document.querySelectorAll(queryColorTip);

  for (const colorTip of colorTips) {
    const style = getComputedStyle(colorTip);
    const background = toRGB(style.getPropertyValue("background-color"));
    const foreground = toRGB(style.getPropertyValue("color"));
    colorTip.textContent = background.toString({
      format: {
        coords: ["<number>[0, 255]", "<number>[0, 255]", "<number>[0, 255]"],
        name: "rgb",
      },
      precision: 0,
    });
    const contrastCell = colorTip.parentElement.nextElementSibling;
    const ratio = round(background.contrast(foreground, "WCAG21"));

    if (colorTip.classList.contains("js-test-color-flip")) {
      const score = round(foreground.contrast(background, "APCA"));
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    } else {
      const score = round(background.contrast(foreground, "APCA"));
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    }
  }
});
