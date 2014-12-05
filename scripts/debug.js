document.body.addEventListener('dblclick', function () {
  if (/\bshow-column\b/.test(this.className)) {
    this.className = this.className.replace(/ \bdebug\b/, '');
  } else {
    this.className += ' show-column';
  }
}, false);

document.querySelector('#introduction h1').addEventListener('click', function (e) {
  if (e.which === 1) {
    var body = document.body;

    if (/\bpermalink\b/.test(body.className)) {
      body.className = body.className.replace(/\s?\bpermalink\b/, '');
    } else {
      body.className += ' permalink';
    }

    e.preventDefault();
  }
}, false);

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
