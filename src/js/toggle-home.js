"use strict";

(function (d) {
  var className = "at-home";

  function toggle(globalHeader, logo, siteNavigation, sectionFooter, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    globalHeader.classList.toggle(className);
    logo.classList.toggle(className);
    siteNavigation.classList.toggle(className);
    sectionFooter.classList.toggle(className);
    evt.target.classList.toggle(className);
  }

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(
      null,
      d.querySelector(".global-header"),
      d.querySelector(".logo"),
      d.querySelector(".site-navigation"),
      d.querySelector(".section-footer")
    ),
    false
  );
})(document);
