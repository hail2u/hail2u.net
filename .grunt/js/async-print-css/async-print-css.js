/**
 * @preserve async-print-css.js
 *
 * LICENSE: http://hail2u.mit-license.org/2014
 */
(function () {
  var cssPrint = '/styles/print.min.css';

  if (location.protocol === 'file:') {
    cssPrint = '../..' + cssPrint;
  }

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.media = 'print';
  link.href = cssPrint;
  document.head.appendChild(link);
})();
