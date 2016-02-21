/**
 * @preserve set-title-for-post-list.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
(function (d) {
  "use strict";

  var load = function () {
    var a = d.querySelectorAll(".post-list a");
    var i;
    var l = a.length;

    for (i = 0; i < l; i++) {
      a[i].title = a[i].textContent;
    }
  };

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", load, false);
  } else {
    load();
  }
})(document);
