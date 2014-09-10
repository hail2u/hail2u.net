document.querySelector('.tagline').addEventListener('click', function () {
  var debug  = 'Lorem ipsum dolor sit amet, consectetur <em>adipiscing</em> elit. Cras sit amet risus ac odio porta sodales. Etiam consectetur eros et lacus &amp; tristique <em>imperdiet</em>.';
  var store = 'data-original';
  var current = this.getAttribute(store);
  this.setAttribute(store, this.innerHTML);

  if (current && current !== debug) {
    this.innerHTML = current;
  } else {
    this.innerHTML = debug;
  }
}, false);
