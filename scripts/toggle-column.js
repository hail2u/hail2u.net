(function () {
  "use strict";

  var toggle = function () {
    this.classList.toggle("show-column");
  };

  document.body.addEventListener("dblclick", toggle, false);
})();
