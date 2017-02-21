"use strict";

(function () {
  document.body.addEventListener("dblclick", function () {
    this.classList.toggle("js-debug-columns");
  }, false);
})();
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
"use strict";

(function () {
  document.body.addEventListener("dblclick", function () {
    this.classList.toggle("js-debug-elements");
  }, false);
})();
