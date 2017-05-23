/*!
 * ellipsis-title.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

const ellipsisTitle = () => {
  for (const elm of document.querySelectorAll("*")) {
    if (window.getComputedStyle(elm)["text-overflow"] === "ellipsis") {
      elm.title = elm.textContent;
    }
  }
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", ellipsisTitle);
} else {
  ellipsisTitle();
}
