const showNextOthers = event => {
  const others = document.querySelector(".js-append-others-others");
  const button = others.content.querySelector("button");

  if (button) {
    button.addEventListener("click", showNextOthers);
  }

  others.parentNode.appendChild(others.content);
  others.parentNode.removeChild(others);
  const self = event.target;
  self.parentNode.hidden = true;
};

const button = document.querySelector(".js-append-others-button");
button.content.querySelector("button").addEventListener("click", showNextOthers);
button.parentNode.appendChild(button.content);
document.querySelector(".js-append-others-link").hidden = true;
