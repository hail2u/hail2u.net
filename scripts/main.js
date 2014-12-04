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
      href: '/fonts/megrim.min.css'
    },
    {
      href: '/fonts/source-code-pro.min.css'
    },
    {
      href: '/fonts/source-sans-pro.min.css'
    }
  ];
  var links = d.createDocumentFragment();
  csses.forEach(function (css) {
    var link = d.createElement('link');
    link.rel = 'stylesheet';

    if (!/^https?:/.test(css.href) && location.protocol === 'file:') {
      css.href = '../../build' + css.href;
    }

    link.href = css.href;

    if (css.media) {
      link.media = css.media;
    }

    links.appendChild(link);
  });
  d.head.appendChild(links);
})(document);
