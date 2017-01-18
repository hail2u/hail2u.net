"use strict";

(function () {
  function toggle(eyecatch) {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }
  }

  document.querySelector("footer")
    .addEventListener("click", toggle.bind(null, document.querySelector(".fill")), false);
})();
