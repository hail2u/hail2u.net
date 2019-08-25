(() => {
  const button = document.getElementById("append-others-button");
  button.content.querySelector("button").addEventListener("click", event => {
    const others = document.getElementById("append-others-others");
    others.parentNode.appendChild(others.content);
    const self = event.target;
    self.parentNode.hidden = true;
  });
  button.parentNode.appendChild(button.content);
})();
