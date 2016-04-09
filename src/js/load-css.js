/**
 * @preserve load-css.js
 *
 * LICENSE: http://hail2u.mit-license.org/2015
 */
(function () {
  "use strict";

  var i;
  var l;
  var s = document.querySelectorAll('link[class="js-load-css"]');

  for (i = 0, l = s.length; i < l; i++) {
    s[i].rel += " stylesheet";
  }
})();
