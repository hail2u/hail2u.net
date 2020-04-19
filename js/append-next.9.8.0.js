(function(){'use strict';
function b(d) {
  var a = document.querySelector(".js-append-next"), c = a.content.querySelector("button");
  c && c.addEventListener("click", b);
  a.parentNode.insertBefore(a.content, a);
  a.remove();
  d.target.parentNode.hidden = !0;
}
b({target:document.querySelector(".js-append-next-fallback a")});
}).call(this);