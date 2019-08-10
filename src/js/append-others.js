(() => {
  document.querySelector("button").addEventListener("click", event => {
    const others = document.querySelector("template");
    others.parentNode.appendChild(others.content);
    const button = event.target;
    button.hidden = true;
  });
})();
