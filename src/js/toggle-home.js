"use strict";

(function (d) {
  var className = "at-home";

  function toggle(globalHeader, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    globalHeader.classList.toggle(className);
    evt.target.classList.toggle(className);
  }

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(
      null,
      d.querySelector(".global-header")
    ),
    false
  );
})(document);
