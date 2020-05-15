(function(){"use strict";

var removeHashTop = function removeHashTop() {
  if (location.hash === "#top") {
    history.replaceState(null, "", "".concat(location.pathname).concat(location.search));
  }
};

window.addEventListener("hashchange", removeHashTop);})();