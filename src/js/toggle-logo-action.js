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

  var scrollToTop = function (styleBody, styleLogo, evt) {
    var body = d.body;
    var scrollDistance = body.scrollTop;
    var doScroll = function () {
      styleBody.transition = styleLogo.transition = "initial";
      styleBody.marginTop = styleLogo.marginTop = "0px";
      w.scrollTo(0, 0);
      body.removeEventListener("transitionend", doScroll, false);
    };
    body.addEventListener("transitionend", doScroll, false);
    styleBody.transition = styleLogo.transition = "margin-top .5s ease-in-out";
    styleBody.marginTop = scrollDistance + "px";
    styleLogo.marginTop = "-" + scrollDistance + "px";
    evt.preventDefault();
  };

  var init = function () {
    var logo = d.querySelector(".logo");
    var heightLogo = logo.scrollHeight;
    var hrefToTop = "#top";
    var styleBody = d.body.style;
    var styleLogo = logo.style;
    var classToTop = " to-top";
    var reClassToTop = new RegExp(classToTop);
    var toggleLogoAction = debounce(function (fn) {
      if (w.pageYOffset < heightLogo) {
        logo.removeEventListener("click", fn, false);
        logo.className = logo.className.replace(reClassToTop, "");

        if (logo.href) {
          logo.href = "/";
        }

        return;
      }

      if (logo.href && logo.href.endsWith(hrefToTop)) {
        return;
      }

      logo.addEventListener("click", fn, false);
      logo.className += classToTop;

      if (logo.href) {
        logo.href = hrefToTop;
      }
    }, 500).bind(null, scrollToTop.bind(null, styleBody, styleLogo));

    w.addEventListener("scroll", toggleLogoAction, false);
  };

  if (d.readyState === "loading") {
    d.addEventListener("DOMContentLoaded", init, false);
  } else {
    init();
  }
})(window, document);
