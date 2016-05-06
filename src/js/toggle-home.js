"use strict";

(function (d) {
  var className = "is-used-at-home";

  function toggle(logo, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    logo.classList.toggle(className);
    evt.target.classList.toggle(className);
  }

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(null, d.querySelector(".logo")),
    false
  );
})(document);
