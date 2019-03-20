/*!
 * unutm.js
 * LICENSE: http://hail2u.mit-license.org/2013
 */
if (location.search) {
  const unutmed = location.search
    .replace(/[?&]utm_[^&]+/g, "")
    .replace(/^&/, "?");
  history.replaceState(null, "", `${location.pathname}${unutmed}${location.hash}`);
}
