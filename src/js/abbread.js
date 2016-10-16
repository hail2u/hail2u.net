/*!
 * abbread.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  let abbr;
  let def = {};
  let desc = "";
  let text = "";

  for (abbr of document.querySelectorAll("abbr")) {
    text = abbr.textContent;
    desc = abbr.title;

    if (desc && !def[text]) {
      def[text] = desc;

      continue;
    }

    if (def[text]) {
      abbr.title = def[text];
    }
  }
})();
