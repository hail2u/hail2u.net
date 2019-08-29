const button = document.querySelector(".js-append-others-button");
button.content.querySelector("button").addEventListener("click", event => {
  const others = document.querySelector(".js-append-others-others");
  others.parentNode.appendChild(others.content);
  const self = event.target;
  self.parentNode.hidden = true;
});
button.parentNode.appendChild(button.content);
document.querySelector(".js-append-others-nav").hidden = true;
