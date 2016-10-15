/*!
 * reldate.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function () {
  const now = Date.now();
  const toRelativeDate = function (then) {
    let diff = 0;

    if (!Number.isInteger(then)) {
      return;
    }

    diff = parseInt((now - then) / 1000, 10);

    if (diff < 0) {
      return;
    }

    if (diff < 60) {
      return diff + "秒前";
    }

    diff = parseInt(diff / 60, 10);

    if (diff < 60) {
      return diff + "分前";
    }

    diff = parseInt(diff / 60, 10);

    if (diff < 24) {
      return diff + "時間前";
    }

    diff = parseInt(diff / 24, 10);

    if (diff < 30) {
      return diff + "日前";
    }

    diff = parseInt(diff / 30, 10);

    if (diff < 12) {
      return diff + "ヶ月前";
    }

    return parseInt(diff / 12, 10) + "年前";
  };

  for (let time of document.querySelectorAll("time")) {
    let abs = time.getAttribute("datetime");
    let rel = "";

    if (!abs) {
      continue;
    }

    rel = toRelativeDate(Date.parse(abs));

    if (rel) {
      time.setAttribute("title", abs);
      time.textContent = rel;
    }
  }
})();
