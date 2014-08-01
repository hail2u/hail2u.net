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
      href: '/fonts/megrim.css'
    },
    {
      href: '/fonts/source-code-pro.css'
    },
    {
      href: '/fonts/source-sans-pro.css'
    }
  ];
  var links = d.createDocumentFragment();
  csses.forEach(function (css) {
    var link = d.createElement('link');
    link.rel = 'stylesheet';

    if (location.protocol === 'file:') {
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
