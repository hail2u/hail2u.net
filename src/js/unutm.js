/*!
 * unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
"use strict";

(function (l) {
  if (!l.search) {
    return;
  }

  history.replaceState(null, "", `${l.pathname}${l.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?")}${l.hash}`);
})(location);
