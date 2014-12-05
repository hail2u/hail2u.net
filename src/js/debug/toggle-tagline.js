(function () {
  var debug  = 'Lorem ipsum dolor sit amet, consectetur <em>adipiscing</em> elit. Cras sit amet risus ac odio porta sodales. Etiam consectetur eros et lacus &amp; tristique <em>imperdiet</em>.';
  var store = 'data-original';
  var tagline = document.querySelector('.tagline');
  tagline.setAttribute(store, tagline.innerHTML);
  tagline.addEventListener('click', function () {
    var current = this.innerHTML;

    if (current !== debug) {
      this.innerHTML = debug;
    } else {
      this.innerHTML = this.getAttribute(store);
    }
  }, false);
})();
