(() => {
  const appendOthers = event => {
    const button = event.target;
    const others = document.querySelector("template");
    button.hidden = true;
    others.parentNode.appendChild(others.content);
  };

  document.querySelector("button").addEventListener("click", appendOthers);
})();
