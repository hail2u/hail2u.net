/*!
 * site-search-focus.js
 *
 * LICENSE: http://hail2u.mit-license.org/2017
 */
"use strict";

const focusSiteSearch = () => {
  document.getElementById("site_search").focus();
};
const siteSearchFocus = () => {
  document.getElementById("site_search_icon")
    .addEventListener("click", focusSiteSearch);
};

window.addEventListener("hashchange", () => {
  if (location.hash === "#site_search") {
    focusSiteSearch();
  }
});

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", siteSearchFocus);
} else {
  siteSearchFocus();
}
