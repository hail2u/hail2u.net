(function () {
  'use strict';

  var t = function () {
    var eyecatch = document.querySelector('.full-width');
    var sectionFooter = document.querySelector('.section-footer');
    sectionFooter.addEventListener('click', function (evt) {
      if (eyecatch.hidden) {
        eyecatch.hidden = false;
      } else {
        eyecatch.hidden = true;
      }

      evt.preventDefault();
      evt.stopPropagation();
    }, false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', t, false);
  } else {
    t();
  }
})();
