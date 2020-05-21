(function(){"use strict";

var setRandomLink = function setRandomLink() {
  var links = document.querySelectorAll(".js-random-link-link[href]");
  var link = links[Math.floor(Math.random() * links.length)];
  var href = link.getAttribute("href");
  var template = document.querySelector(".js-random-link");
  template.content.querySelector("a").setAttribute("href", href);
  template.parentNode.insertBefore(template.content, template);
  template.parentNode.removeChild(template);
};

setRandomLink();})();