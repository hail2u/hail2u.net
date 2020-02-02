(function(){'use strict';
function b(e) {
  var a = document.querySelector(".js-append-others-others"), d = a.content.querySelector("button");
  d && d.addEventListener("click", b);
  a.parentNode.appendChild(a.content);
  a.parentNode.removeChild(a);
  e.target.parentNode.hidden = !0;
}
var c = document.querySelector(".js-append-others-button");
c.content.querySelector("button").addEventListener("click", b);
c.parentNode.appendChild(c.content);
document.querySelector(".js-append-others-link").hidden = !0;
}).call(this);