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
(function() {
  var a = document.querySelector(".js-site-search");
  a.content.querySelector(".js-site-search-form").addEventListener("submit", function(a) {
    a = a.srcElement.q;
    a.value += " site:hail2u.net";
  });
  a.parentNode.insertBefore(a.content, a);
  a.remove();
  a = document.querySelector(".js-site-search-fallback");
  a.textContent = a.dataset.normal;
})();
}).call(this);