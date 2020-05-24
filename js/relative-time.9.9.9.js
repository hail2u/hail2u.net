(function(){"use strict";

function _createForOfIteratorHelper(o) { if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (o = _unsupportedIterableToArray(o))) { var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var it, normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var toRelativeTime = function toRelativeTime(dt) {
  var divisor = {
    "day": 24,
    "hour": 60,
    "minute": 60,
    "month": 30,
    "second": 1000,
    "year": 12
  };
  var now = performance.timing.navigationStart + performance.now();
  var suffix = "前";
  var unit = {
    "day": "日",
    "hour": "時間",
    "minute": "分",
    "month": "か月",
    "now": "たった今",
    "second": " 秒",
    "year": "年"
  };

  if (!Number.isInteger(dt)) {
    return false;
  }

  var diff = Math.round((now - dt) / divisor.second);

  if (!Number.isInteger(diff) || diff < 0) {
    return false;
  }

  if (diff < divisor.minute / 2) {
    return unit.now;
  }

  if (diff < divisor.minute) {
    return "".concat(diff, " ").concat(unit.second).concat(suffix);
  }

  diff = Math.round(diff / divisor.minute);

  if (diff < divisor.hour) {
    return "".concat(diff, " ").concat(unit.minute).concat(suffix);
  }

  diff = Math.round(diff / divisor.hour);

  if (diff < divisor.day) {
    return "".concat(diff, " ").concat(unit.hour).concat(suffix);
  }

  diff = Math.round(diff / divisor.day);

  if (diff < divisor.month) {
    return "".concat(diff, " ").concat(unit.day).concat(suffix);
  }

  diff = Math.round(diff / divisor.month);

  if (diff < divisor.year) {
    return "".concat(diff, " ").concat(unit.month).concat(suffix);
  }

  diff = Math.round(diff / divisor.year);
  return "".concat(diff, " ").concat(unit.year).concat(suffix);
};

var _iterator = _createForOfIteratorHelper(document.querySelectorAll("time.js-relative-time[datetime]")),
    _step;

try {
  for (_iterator.s(); !(_step = _iterator.n()).done;) {
    var time = _step.value;
    var absolute = time.getAttribute("datetime");
    var relative = toRelativeTime(Date.parse(absolute));

    if (relative) {
      time.setAttribute("title", absolute);
      time.textContent = relative;
    }
  }
} catch (err) {
  _iterator.e(err);
} finally {
  _iterator.f();
}})();