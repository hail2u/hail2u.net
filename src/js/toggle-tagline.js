(function (d) {
  "use strict";

  var toggle = function (tagline, html, evt) {
    if (tagline.hidden) {
      tagline.hidden = false;
    } else {
      tagline.hidden = true;
    }

    html.classList.toggle("permalink");
    evt.preventDefault();
  };

  d.querySelector(".first-heading").addEventListener(
    "click",
    toggle.bind(null, d.querySelector(".tagline"), d.documentElement),
    false
  );
})(document);
