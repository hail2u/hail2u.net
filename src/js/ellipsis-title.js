/*!
 * ellipsis-title.js
 * LICENSE: http://hail2u.mit-license.org/2016
 */
const ellipsisTitle = () => {
  for (const elm of document.querySelectorAll("*")) {
    if (window.getComputedStyle(elm)["text-overflow"] === "ellipsis") {
      elm.title = elm.textContent;
    }
  }
};

if (document.readyState !== "loading") {
  ellipsisTitle();
} else {
  document.addEventListener("DOMContentLoaded", ellipsisTitle);
}
