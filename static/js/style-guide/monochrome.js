/* Toggle monochrome CSS filter | MIT License */
document
  .querySelector(".js-test-monochrome-button")
  .addEventListener("click", () => {
    document.documentElement.classList.toggle("js-test-monochrome");
  });
