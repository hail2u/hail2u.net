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
if (location.search) {
  var d = location.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?");
  history.replaceState(null, "", "" + location.pathname + d + location.hash);
}
;}).call(this);