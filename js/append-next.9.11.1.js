(function(){"use strict";

(function () {
  var append = function append(_ref) {
    var target = _ref.target;
    var template = document.querySelector(".js-append-next");
    var button = template.content.querySelector("button");

    if (button) {
      button.addEventListener("click", append);
    }

    template.parentNode.insertBefore(template.content, template);
    template.parentNode.removeChild(template);
    target.parentNode.hidden = true;
  };

  var init = function init() {
    append({
      "target": document.querySelector(".js-append-next-fallback p")
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
    return;
  }

  init();
})();})();