/*!
 * abbread.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

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
/*!
 * ellipsis-title.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

for (const elm of document.querySelectorAll("*")) {
  if (window.getComputedStyle(elm)["text-overflow"] === "ellipsis") {
    elm.title = elm.textContent;
  }
}
/*!
 * reldate.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

const now = Date.now();

function toRelativeDate(from, to) {
  let diff = 0;

  if (!Number.isInteger(to)) {
    return;
  }

  diff = parseInt((from - to) / 1000, 10);

  if (!Number.isInteger(diff) || diff < 0) {
    return;
  }

  if (diff === 0) {
    return "たった今";
  }

  if (diff < 60) {
    return `${diff}秒前`;
  }

  diff = parseInt(diff / 60, 10);

  if (diff < 60) {
    return `${diff}分前`;
  }

  diff = parseInt(diff / 60, 10);

  if (diff < 24) {
    return `${diff}時間前`;
  }

  diff = parseInt(diff / 24, 10);

  if (diff < 30) {
    return `${diff}日前`;
  }

  diff = parseInt(diff / 30, 10);

  if (diff < 12) {
    return `${diff}ヶ月前`;
  }

  return `${parseInt(diff / 12, 10)}年前`;
}

for (const time of document.querySelectorAll("time.js-reldate[datetime]")) {
  const abs = time.getAttribute("datetime");
  const rel = toRelativeDate(now, Date.parse(abs));

  if (rel) {
    time.setAttribute("title", abs);
    time.textContent = rel;
  }
}
/*!
 * unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
"use strict";

if (location.search) {
  history.replaceState(null, "", `${location.pathname}${location.search.replace(/[?&]utm_[^&]+/g, "").replace(/^&/, "?")}${location.hash}`);
}
/*!
 * wrapfix.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

for (const h1 of document.querySelectorAll("main h1")) {
  if (h1.childNodes.length !== 1 || h1.firstChild.nodeType !== 3) {
    continue;
  }

  const text = h1.textContent.split("");

  h1.textContent = text.slice(0, -2)
    .concat(text.slice(-2).map((c) => {
      return `\uFEFF${c}`;
    }))
    .join("");
}
