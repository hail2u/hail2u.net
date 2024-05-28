/* Calculate contrast | MIT License */
import { getContrastRatio } from "../lib/wcag21.js";
import { getContrastScore } from "../lib/apca.js";

window.addEventListener("load", () => {
  const queryColorCell = ".test-color > tbody > tr > td:nth-child(2)";
  const colorCells = document.querySelectorAll(queryColorCell);

  for (const colorCell of colorCells) {
    const style = getComputedStyle(colorCell);
    const background = style.getPropertyValue("background-color");
    const foreground = style.getPropertyValue("color");
    colorCell.textContent = background;
    const contrastCell = colorCell.nextElementSibling;
    const ratio = getContrastRatio(foreground, background);

    if (colorCell.classList.contains("js-test-color-flip")) {
      const score = getContrastScore(foreground, background);
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    } else {
      const score = getContrastScore(background, foreground);
      contrastCell.lastChild.textContent = `${ratio} (${score})`;
    }
  }
});
