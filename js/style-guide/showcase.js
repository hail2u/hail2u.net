/* Toggle Showcase component row | MIT License */
document
  .querySelector(".js-test-showcase-button")
  .addEventListener("click", () => {
    document.querySelector(".js-test-showcase").classList.toggle("oneline");
  });
