/**
 * @preserve toggle-logo-action.js
 *
 * LICENSE: http://hail2u.mit-license.org/2014
 */
document.addEventListener('readystatechange', function () {
  var globalHeader = document.querySelector('body > header');
  var logo = globalHeader.querySelector('h1').firstElementChild;
  var siteNavigation = globalHeader.querySelector('nav');
  var store = 'data-original-href';

  var debounce = function (fn, delay) {
    var timeout = null;

    return function () {
      var context = this;
      var args = arguments;
      var delayed = function () {
        fn.apply(context, args);
        timeout = null;
      };

      if (timeout) {
        window.clearTimeout(timeout);
      }

      timeout = window.setTimeout(delayed, delay);
    };
  };

  var scrollToTop = function (evt) {
    window.scrollTo(0, 0);
    evt.preventDefault();
  };

  var toggleLogoAction = function (evt) {
    var originalHref = logo.getAttribute(store);

    if (window.pageYOffset > globalHeader.offsetTop + siteNavigation.scrollHeight) {
      logo.addEventListener('click', scrollToTop, false);

      if (logo.tagName === 'A' && !originalHref) {
        logo.setAttribute(store, logo.href);
        logo.href = '#top';
      }

      return;
    }

    logo.removeEventListener('click', scrollToTop, false);

    if (logo.tagName === 'A' && originalHref) {
      logo.href = originalHref;
      logo.removeAttribute(store);
    }
  };

  toggleLogoAction();
  window.addEventListener('scroll', debounce(toggleLogoAction, 500), false);
});
