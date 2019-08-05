(() => {
  const appendOthers = event => {
    const button = event.target;
    const to = document.querySelector("main");
    const others = document.querySelector("template").content;
    button.hidden = true;
    to.appendChild(others);
  };

  document.querySelector("button").addEventListener("click", appendOthers);
})();
