/*!
 * abbread.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  var a;
  var b;
  var e = document.querySelectorAll("abbr");
  var i = 0;
  var l = e.length;
  var t;
  var x = {};

  for (; i < l; i++) {
    a = e[i];
    b = a.textContent;
    t = a.title;

    if (t && !x[b]) {
      x[b] = t;

      continue;
    }

    if (x[b]) {
      a.title = x[b];
    }
  }
})();
