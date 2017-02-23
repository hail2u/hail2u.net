/*!
 * unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
"use strict";

if (location.search) {
  history.replaceState(null, "", `${location.pathname}${location.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?")}${location.hash}`);
}
