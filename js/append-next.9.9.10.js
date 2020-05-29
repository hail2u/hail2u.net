(function(){"use strict";

var showNext = function showNext(_ref) {
  var target = _ref.target;
  var template = document.querySelector(".js-append-next");
  var button = template.content.querySelector("button");

  if (button) {
    button.addEventListener("click", showNext);
  }

  template.parentNode.insertBefore(template.content, template);
  template.parentNode.removeChild(template);
  target.parentNode.hidden = true;
};

showNext({
  "target": document.querySelector(".js-append-next-fallback p")
});})();