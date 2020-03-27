(function(){'use strict';
var b = b || {};
b.scope = {};
b.createTemplateTagFirstArg = function(a) {
  return a.raw = a;
};
b.createTemplateTagFirstArgWithRaw = function(a, c) {
  a.raw = c;
  return a;
};
window.addEventListener("hashchange", function() {
  "#top" === location.hash && history.replaceState(null, "", "" + location.pathname + location.search);
});
}).call(this);