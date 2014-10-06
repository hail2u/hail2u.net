/**
 * @preserve unutm.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
(function (l, h) {
  if (!l.search || !h.replaceState) {
    return;
  }

  var unutm = function () {
    var u = l.pathname +
      l.search.replace(/[?&]utm_[^&]+/g, '').replace(/^&/, '?') +
      l.hash;
    h.replaceState(null, '', u);
  };

  if (typeof ga === 'function') {
    ga(unutm());
  } else {
    unutm();
  }
})(location, history);

/**
 * @preserve async-csses.js
 *
 * LICENSE: http://hail2u.mit-license.org/2014
 */
(function (d) {
  var csses = [
    {
      href: '/styles/print.min.css',
      media: 'print'
    },
    {
      href: 'http://fonts.googleapis.com/css?family=Megrim&text=%26'
    },
    {
      href: 'http://fonts.googleapis.com/css?family=Source+Sans+Pro:200,400,700,200italic,400italic,700italic|Source+Code+Pro:400,700'
    }
  ];
  var links = d.createDocumentFragment();
  csses.forEach(function (css) {
    var link = d.createElement('link');
    link.rel = 'stylesheet';

    if (!/^https?:/.test(css.href) && location.protocol === 'file:') {
      css.href = '../..' + css.href;
    }

    link.href = css.href;

    if (css.media) {
      link.media = css.media;
    }

    links.appendChild(link);
  });
  d.head.appendChild(links);
})(document);

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
        logo.setAttribute('class', 'to-top');
        logo.setAttribute(store, logo.href);
        logo.href = '#top';
      }

      return;
    }

    logo.removeEventListener('click', scrollToTop, false);

    if (logo.tagName === 'A' && originalHref) {
      logo.href = originalHref;
      logo.removeAttribute(store);
      logo.removeAttribute('class');
    }
  };

  toggleLogoAction();
  window.addEventListener('scroll', debounce(toggleLogoAction, 500), false);
});
