(function (d) {
  'use strict';

  var toggle = function (eyecatch, evt) {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }

    evt.preventDefault();
    evt.stopPropagation();
  };

  var init = function () {
    var eyecatch = d.querySelector('.full-width');
    d.querySelector('.section-footer').addEventListener(
      'click',
      toggle.bind(null, eyecatch),
      false
    );
  };

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})(document);
