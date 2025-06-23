/* Test contrast | MIT License */
import Color from "../lib/color.min.js";

const showContrast = () => {
  const queryColorTip = ".test-color > tbody > tr > td:nth-child(2) .test";
  const colorTips = document.querySelectorAll(queryColorTip);

  for (const colorTip of colorTips) {
    const style = getComputedStyle(colorTip);
    const background = new Color(style.getPropertyValue("background-color"));
    const foreground = new Color(style.getPropertyValue("color"));
    colorTip.textContent = background.to("srgb").toString({
      format: {
        coords: ["<number>[0, 255]", "<number>[0, 255]", "<number>[0, 255]"],
        name: "rgb",
      },
      precision: 0,
    });
    const contrastCell = colorTip.parentElement.nextElementSibling;
    const ratio =
      Math.round(background.contrast(foreground, "WCAG21") * 1000) / 1000;

    if (colorTip.classList.contains("js-test-color-flip")) {
      const score =
        Math.round(foreground.contrast(background, "APCA") * 1000) / 1000;
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    } else {
      const score =
        Math.round(background.contrast(foreground, "APCA") * 1000) / 1000;
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    }
  }
};

window.addEventListener("load", showContrast);
