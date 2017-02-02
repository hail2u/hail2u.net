/*!
 * abbread.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  const def = {};

  let desc = "";
  let text = "";

  for (const abbr of document.querySelectorAll("abbr")) {
    desc = abbr.title;
    text = abbr.textContent;

    if (desc && !def[text]) {
      def[text] = desc;

      continue;
    }

    if (def[text]) {
      abbr.title = def[text];
    }
  }
})();
