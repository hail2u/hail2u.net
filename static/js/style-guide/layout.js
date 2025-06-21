/* Toggle layout overlay | MIT License */
const toggleLayoutOverlay = () => {
  document.body.classList.toggle("js-test-layout");
};

document
  .querySelector(".js-test-layout-button")
  .addEventListener("click", toggleLayoutOverlay);
