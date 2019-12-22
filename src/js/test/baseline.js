document.querySelector(".js-test-baseline-button").addEventListener("click", () => {
  const toggleDisabled = element => {
    if (element.hasAttribute("rel")) {
      element.removeAttribute("rel");
      return;
    }

    element.setAttribute("rel", "stylesheet");
  };

  document.querySelectorAll(".js-test-baseline").forEach(toggleDisabled);
});
