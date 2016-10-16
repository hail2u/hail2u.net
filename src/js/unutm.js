/*!
 * unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
"use strict";

(function (l, h) {
  if (!l.search || !h.replaceState) {
    return;
  }

  h.replaceState(
    null,
    "",
    l.pathname + l.search.replace(
      /[?&]utm_[^&]+/g,
      ""
    ).replace(
      /^&/,
      "?"
    ) + l.hash
  );
})(location, history);
