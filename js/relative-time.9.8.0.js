(function(){'use strict';
var b = b || {};
b.scope = {};
b.createTemplateTagFirstArg = function(a) {
  return a.raw = a;
};
b.createTemplateTagFirstArgWithRaw = function(a, c) {
  a.raw = c;
  return a;
};
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
    for (var e = 0; e < a.length - 1; e++) {
      var f = a[e];
      f in d || (d[f] = {});
      d = d[f];
    }
    a = a[a.length - 1];
    e = d[a];
    c = c(e);
    c != e && null != c && b.defineProperty(d, a, {configurable:!0, writable:!0, value:c});
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
function g(a) {
  var c = performance.timing.navigationStart + performance.now();
  if (Number.isInteger(a) && (a = Math.round((c - a) / 1000), Number.isInteger(a) && !(0 > a))) {
    if (30 > a) {
      return "\u305f\u3063\u305f\u4eca";
    }
    if (60 > a) {
      return a + "  \u79d2\u524d";
    }
    a = Math.round(a / 60);
    if (60 > a) {
      return a + " \u5206\u524d";
    }
    a = Math.round(a / 60);
    if (24 > a) {
      return a + " \u6642\u9593\u524d";
    }
    a = Math.round(a / 24);
    if (30 > a) {
      return a + " \u65e5\u524d";
    }
    a = Math.round(a / 30);
    if (12 > a) {
      return a + " \u304b\u6708\u524d";
    }
    a = Math.round(a / 12);
    return a + " \u5e74\u524d";
  }
}
for (var h = b.makeIterator(document.querySelectorAll("time.js-relative-time[datetime]")), k = h.next(); !k.done; k = h.next()) {
  var l = k.value, m = l.getAttribute("datetime"), n = g(Date.parse(m));
  n && (l.setAttribute("title", m), l.textContent = n);
}
;}).call(this);