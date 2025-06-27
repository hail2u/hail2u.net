/* Toggle Showcase mode | MIT License */
const toggleShowcaseMode = () => {
  document.querySelector(".js-test-showcase").classList.toggle("oneline");
};

document
  .querySelector(".js-test-showcase-button")
  .addEventListener("click", toggleShowcaseMode);
