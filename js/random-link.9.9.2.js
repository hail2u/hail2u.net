(function(){"use strict";

var setRandomLink = function setRandomLink() {
  var links = document.querySelectorAll(".js-random-link-link[href]");
  var link = links[Math.floor(Math.random() * links.length)];
  var href = link.getAttribute("href");
  document.querySelector(".js-random-link").setAttribute("href", href);
};

setRandomLink();})();