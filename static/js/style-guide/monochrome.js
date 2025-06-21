/* Toggle monochrome filter | MIT License */
const toggleMonochromeFilter = () => {
  document.documentElement.classList.toggle("js-test-monochrome");
};

document
  .querySelector(".js-test-monochrome-button")
  .addEventListener("click", toggleMonochromeFilter);
