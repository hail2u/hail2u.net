(function(){'use strict';
var b = b || {};
b.scope = {};
b.arrayIteratorImpl = function(a) {
  var c = 0;
  return function() {
    return c < a.length ? {done:!1, value:a[c++]} : {done:!0};
  };
};
b.arrayIterator = function(a) {
  return {next:b.arrayIteratorImpl(a)};
};
b.makeIterator = function(a) {
  var c = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
  return c ? c.call(a) : b.arrayIterator(a);
};
b.ASSUME_ES5 = !1;
b.ASSUME_NO_NATIVE_MAP = !1;
b.ASSUME_NO_NATIVE_SET = !1;
b.SIMPLE_FROUND_POLYFILL = !1;
b.defineProperty = b.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, c, d) {
  a != Array.prototype && a != Object.prototype && (a[c] = d.value);
};
b.getGlobal = function(a) {
  a = ["object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global, a];
  for (var c = 0; c < a.length; ++c) {
    var d = a[c];
    if (d && d.Math == Math) {
      return d;
    }
  }
  throw Error("Cannot find global object");
};
b.global = b.getGlobal(this);
b.polyfill = function(a, c) {
  if (c) {
    var d = b.global;
    a = a.split(".");
    for (var g = 0; g < a.length - 1; g++) {
      var h = a[g];
      h in d || (d[h] = {});
      d = d[h];
    }
    a = a[a.length - 1];
    g = d[a];
    c = c(g);
    c != g && null != c && b.defineProperty(d, a, {configurable:!0, writable:!0, value:c});
  }
};
b.polyfill("Number.isFinite", function(a) {
  return a ? a : function(a) {
    return "number" !== typeof a ? !1 : !isNaN(a) && Infinity !== a && -Infinity !== a;
  };
}, "es6", "es3");
b.polyfill("Number.isInteger", function(a) {
  return a ? a : function(a) {
    return Number.isFinite(a) ? a === Math.floor(a) : !1;
  };
}, "es6", "es3");
var e = {day:24, hour:60, minute:60, month:30, second:1000, year:12}, f = performance.timing.navigationStart + performance.now(), k = {day:"\u65e5", hour:"\u6642\u9593", minute:"\u5206", month:"\u304b\u6708", now:"\u305f\u3063\u305f\u4eca", second:" \u79d2", year:"\u5e74"};
function l(a) {
  if (Number.isInteger(a) && (a = Math.round((f - a) / e.second), Number.isInteger(a) && !(0 > a))) {
    if (a < e.minute / 2) {
      return k.now;
    }
    if (a < e.minute) {
      return a + " " + k.second + "\u524d";
    }
    a = Math.round(a / e.minute);
    if (a < e.hour) {
      return a + " " + k.minute + "\u524d";
    }
    a = Math.round(a / e.hour);
    if (a < e.day) {
      return a + " " + k.hour + "\u524d";
    }
    a = Math.round(a / e.day);
    if (a < e.month) {
      return a + " " + k.day + "\u524d";
    }
    a = Math.round(a / e.month);
    if (a < e.year) {
      return a + " " + k.month + "\u524d";
    }
    a = Math.round(a / e.year);
    return a + " " + k.year + "\u524d";
  }
}
for (var m = b.makeIterator(document.querySelectorAll("time.js-relative-time[datetime]")), n = m.next(); !n.done; n = m.next()) {
  var p = n.value, q = p.getAttribute("datetime"), r = l(Date.parse(q));
  r && (p.setAttribute("title", q), p.textContent = r);
}
;}).call(this);