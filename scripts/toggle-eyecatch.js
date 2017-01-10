"use strict";

(function (d) {
  function toggle(eyecatch) {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }
  }

  d.querySelector("footer").addEventListener("click", toggle.bind(null, d.querySelector(".fill")), false);
})(document);
