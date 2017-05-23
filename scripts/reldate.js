/*!
 * reldate.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const now = performance.timing.navigationStart + performance.now();
  const toRelativeDate = (from, to) => {
    let diff = 0;

    if (!Number.isInteger(to)) {
      return;
    }

    diff = parseInt((from - to) / 1000, 10);

    if (!Number.isInteger(diff) || diff < 0) {
      return;
    }

    if (diff < 30) {
      return "たった今";
    }

    if (diff < 90) {
      return `${diff}秒前`;
    }

    diff = parseInt(diff / 60, 10);

    if (diff < 90) {
      return `${diff}分前`;
    }

    diff = parseInt(diff / 60, 10);

    if (diff < 36) {
      return `${diff}時間前`;
    }

    diff = parseInt(diff / 24, 10);

    if (diff < 45) {
      return `${diff}日前`;
    }

    diff = parseInt(diff / 30, 10);

    if (diff < 18) {
      return `${diff}ヶ月前`;
    }

    return `${parseInt(diff / 12, 10)}年前`;
  };

  for (const time of document.querySelectorAll("time.js-reldate[datetime]")) {
    const abs = time.getAttribute("datetime");
    const rel = toRelativeDate(now, Date.parse(abs));

    if (rel) {
      time.setAttribute("title", abs);
      time.textContent = rel;
    }
  }
});
