/* Toggle layout overlays | MIT License */
document
  .querySelector(".js-test-layout-button")
  .addEventListener("click", () => {
    document.body.classList.toggle("js-test-layout");
  });
