/**
 * @preserve toggle-logo-action.js
 *
 * LICENSE: http://hail2u.mit-license.org/2014
 */
(function (w, d) {
  "use strict";

  // Polyfill for String#endsWith()
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, position) {
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
    w.scrollTo(0, 0);
    evt.preventDefault();
  };

  var init = function () {
    var logo = document.querySelector(".logo");
    var heightLogo = logo.scrollHeight;
    var hrefToTop = "#top";
    var classToTop = " to-top";
    var toggleLogoAction = debounce(function () {
      if (w.pageYOffset > heightLogo) {
        if (logo.href && logo.href.endsWith(hrefToTop)) {
          return;
        }

        logo.addEventListener("click", scrollToTop, false);
        logo.className += classToTop;

        if (logo.href) {
          logo.href = hrefToTop;
        }

        return;
      }

      logo.removeEventListener("click", scrollToTop, false);
      logo.className = logo.className.replace(new RegExp(classToTop), "");

      if (logo.href) {
        logo.href = "/";
      }
    }, 500);

    toggleLogoAction();
    w.addEventListener("scroll", toggleLogoAction, false);
  };

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})(window, document);
