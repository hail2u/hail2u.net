(function(){'use strict';
window.addEventListener("hashchange", function() {
  "#top" === location.hash && history.replaceState(null, "", "" + location.pathname + location.search);
});
}).call(this);