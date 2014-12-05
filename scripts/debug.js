(function () {
  var c = 'show-column';

  if (!('classList' in document.createElement('_'))) {
    var re = new RegExp(' \\b' + c + '\\b');
    document.body.addEventListener('dblclick', function () {
      if (re.test(this.className)) {
        this.className = this.className.replace(re, '');
      } else {
        this.className += ' ' + c;
      }
    }, false);

    return;
  }

  document.body.addEventListener('dblclick', function () {
    this.classList.toggle(c);
  }, false);
})();

(function () {
  var intro = '#introduction h1';
  var c = 'permalink';

  if (!('classList' in document.createElement('_'))) {
    var re = new RegExp(' \\b' + c + '\\b');
    document.querySelector(intro).addEventListener('click', function (e) {
      if (e.which === 1) {
        var body = document.body;

        if (re.test(body.className)) {
          body.className = body.className.replace(re, '');
        } else {
          body.className += ' ' + c;
        }

        e.preventDefault();
      }
    }, false);

    return;
  }

  document.querySelector(intro).addEventListener('click', function (e) {
    if (e.which === 1) {
      document.body.classList.toggle(c);
    }
  }, false);
})();

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
