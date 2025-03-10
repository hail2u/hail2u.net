/* Calculate contrast | MIT License */
import { getContrastRatio } from "../lib/wcag21.js";
import { getContrastScore } from "../lib/apca.js";

window.addEventListener("load", () => {
  const queryColorTip = ".test-color > tbody > tr > td:nth-child(2) .test";
  const colorTips = document.querySelectorAll(queryColorTip);

  for (const colorTip of colorTips) {
    const style = getComputedStyle(colorTip);
    const background = style.getPropertyValue("background-color");
    const foreground = style.getPropertyValue("color");
    colorTip.textContent = background;
    const contrastCell = colorTip.parentElement.nextElementSibling;
    const ratio = getContrastRatio(foreground, background);

    if (colorTip.classList.contains("js-test-color-flip")) {
      const score = getContrastScore(foreground, background);
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    } else {
      const score = getContrastScore(background, foreground);
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    }
  }
});
