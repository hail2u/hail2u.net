(function () {
  "use strict";

  var toggle = function () {
    this.classList.toggle("show-outline");
  };

  document.body.addEventListener("dblclick", toggle, false);
})();
