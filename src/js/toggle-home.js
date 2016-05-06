"use strict";

(function (d) {
  var className = "is-used-at-home";

  function toggle(globalHeader, sectionFooter, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    globalHeader.classList.toggle(className);
    sectionFooter.classList.toggle(className);
    evt.target.classList.toggle(className);
  }

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(
      null,
      d.querySelector(".global-header"),
      d.querySelector(".section-footer")
    ),
    false
  );
})(document);
