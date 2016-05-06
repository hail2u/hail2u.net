/**
 * @preserve ellipsis-title.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  var e;
  var i;
  var l;
  var n = document.querySelectorAll("*");

  for (i = 0, l = n.length; i < l; i += 1) {
    e = n[i];

    if (window.getComputedStyle(e)["text-overflow"] === "ellipsis") {
      e.title = e.textContent;
    }
  }
})();
