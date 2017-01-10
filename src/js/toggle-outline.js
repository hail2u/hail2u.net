"use strict";

(function () {
  document.body.addEventListener("dblclick", function () {
    this.classList.toggle("js-debug-elements");
  }, false);
})();
