(function (d) {
  "use strict";

  var toggle = function (tagline, html, evt) {
    if (tagline.hidden) {
      tagline.hidden = false;
    } else {
      tagline.hidden = true;
    }

    d.querySelector(".first-heading").classList.toggle("is-in-permalink");
    d.querySelector(".section-footer").classList.toggle("is-in-permalink");
    evt.preventDefault();
  };

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(null, d.querySelector(".tagline"), d.documentElement),
    false
  );
})(document);
