/*!
 * unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
"use strict";

(function () {
  if (!location.search) {
    return;
  }

  history.replaceState(null, "", `${location.pathname}${location.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?")}${location.hash}`);
})();
