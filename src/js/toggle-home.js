"use strict";

(function (d) {
  var className = "is-used-at-home";

  function toggle(logo, sectionFooter, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    logo.classList.toggle(className);
    sectionFooter.classList.toggle(className);
    evt.target.classList.toggle(className);
  }

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(
      null,
      d.querySelector(".logo"),
      d.querySelector(".section-footer")
    ),
    false
  );
})(document);
