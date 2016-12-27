/*!
 * ellipsis-title.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  for (const elm of document.querySelectorAll("*")) {
    if (window.getComputedStyle(elm)["text-overflow"] === "ellipsis") {
      elm.title = elm.textContent;
    }
  }
})();
