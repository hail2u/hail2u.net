/*!
 * site-search-focus.js
 *
 * LICENSE: http://hail2u.mit-license.org/2017
 */
"use strict";

function focusSiteSearch() {
  document.getElementById("site_search").focus();
}

function checkHash() {
  if (location.hash === "#site_search") {
    focusSiteSearch();
  }
}

document.getElementById("site_search_icon").addEventListener("click", focusSiteSearch, false);
window.addEventListener("hashchange", checkHash, false);
