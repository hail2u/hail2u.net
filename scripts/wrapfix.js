/*!
 * wrapfix.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function (d) {
  for (const h1 of d.querySelectorAll("main h1")) {
    if (h1.childNodes.length !== 1 || h1.firstChild.nodeType !== 3) {
      continue;
    }

    const text = h1.textContent.split("");

    h1.textContent = text.slice(0, -2)
      .concat(text.slice(-2).map(function (char) {
        return `\uFEFF${char}`;
      }))
      .join("");
  }
})(document);
