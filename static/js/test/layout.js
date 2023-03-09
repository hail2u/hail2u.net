/* layout.js | MIT License */

const testLayout = () => {
  document.body.classList.toggle("js-test-layout");
};

document
  .querySelector(".js-test-layout-button")
  .addEventListener("click", testLayout);
