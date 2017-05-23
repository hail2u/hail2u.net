/*!
 * site-search-focus.js
 *
 * LICENSE: http://hail2u.mit-license.org/2017
 */
"use strict";

window.addEventListener("hashchange", () => {
  if (location.hash === "#site_search") {
    document.getElementById("site_search").focus();
  }
});
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("site_search_icon")
    .addEventListener("click", () => {
      document.getElementById("site_search").focus();
    });
});
