/**
 * @preserve toggle-logo-action.js
 *
 * LICENSE: http://hail2u.mit-license.org/2014
 */
// Polyfill for String#endsWith()
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (search, position) {
    "use strict";

    var index = 0;
    var subject = this.toString();

    if (position === undefined || position > subject.length) {
      position = subject.length;
    }

    position -= search.length;
    index = subject.lastIndexOf(search, position);

    return index !== -1 && index === position;
  };
}

(function (w, d) {
  "use strict";

  var debounce = function (fn, delay) {
    var timeout = null;

    return function () {
      var args = arguments;
      var context = this;
      var delayed = function () {
        fn.apply(context, args);
        timeout = null;
      };

      if (timeout) {
        w.clearTimeout(timeout);
      }

      timeout = w.setTimeout(delayed, delay);
    };
  };

  var scrollToTop = function (evt) {
    var root = d.documentElement;
    var styleRoot = root.style;
    var doScroll = function () {
      styleRoot.transition = styleRoot.transform = "initial";
      w.scrollTo(0, 0);
      root.removeEventListener("transitionend", doScroll, false);
    };
    var scrollDistance = w.pageYOffset;
    root.addEventListener("transitionend", doScroll, false);
    styleRoot.transition = "transform 1s ease-in-out";
    styleRoot.transform = "translate3d(0, " + scrollDistance + "px, 0)";
    evt.preventDefault();
  };

  var init = function () {
    var logo = d.querySelector(".logo");
    var classToTop = " to-top";
    var reClassToTop = new RegExp(classToTop);
    var hrefToTop = "#top";
    var toggleLogoAction = debounce(function () {
      if (w.pageYOffset < logo.scrollHeight) {
        logo.removeEventListener("click", scrollToTop, false);
        logo.className = logo.className.replace(reClassToTop, "");

        if (logo.href) {
          logo.href = "/";
        }

        return;
      }

      if (logo.href && logo.href.endsWith(hrefToTop)) {
        return;
      }

      logo.addEventListener("click", scrollToTop, false);
      logo.className += classToTop;

      if (logo.href) {
        logo.href = hrefToTop;
      }
    }, 500);
    w.addEventListener("scroll", toggleLogoAction, false);
  };

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})(window, document);
