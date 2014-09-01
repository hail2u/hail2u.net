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
