/*!
 * reltime.js
 *
 * LICENSE: http://hail2u.mit-license.org/2016
 */
"use strict";

(function (d) {
  const now = Date.now();
  const toRelativeDate = function (then) {
    let diff = parseInt((now - then) / 1000);

    if (diff < 0) {
      return;
    }

    if (diff < 60) {
      return diff + "秒前";
    }

    diff = parseInt(diff / 60);

    if (diff < 60) {
      return diff + "分前";
    }

    diff = parseInt(diff / 60);

    if (diff < 24) {
      return diff + "時間前";
    }

    diff = parseInt(diff / 24);

    if (diff < 30) {
      return diff + "日前";
    }

    diff = parseInt(diff / 30);

    if (diff < 12) {
      return diff + "ヶ月前";
    }

    return parseInt(diff / 12) + "年前";
  };

  for (let t of document.querySelectorAll("time")) {
    let d = t.getAttribute("datetime");
    let r = "";

    if (!d) {
      continue;
    }

    r = toRelativeDate(Date.parse(d));

    if (r) {
      t.setAttribute("title", d);
      t.textContent = r;
    }
  }
})();
