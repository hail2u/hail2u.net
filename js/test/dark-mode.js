document.querySelector(".js-test-dark-mode-button").addEventListener("click", () => {
  document.documentElement.classList.toggle("js-dark-mode");

  if (typeof testContrastRatio === "function") {
    testContrastRatio();
  }
});

/* global testContrastRatio */
