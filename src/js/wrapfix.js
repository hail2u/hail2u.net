/*!
 * wrapfix.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function (d) {
  const n = d.querySelectorAll("main h1");

  let e;
  let h;
  let i;
  let l;

  for (i = 0, l = n.length; i < l; i += 1) {
    e = n[i];

    if (e.childNodes.length !== 1 || e.firstChild.nodeType !== 3) {
      continue;
    }

    h = e.textContent.split("");
    e.textContent = h.slice(0, -2).concat(h.slice(-2).map(function (c) {
      return "\uFEFF" + c;
    })).join("");
  }
})(document);
