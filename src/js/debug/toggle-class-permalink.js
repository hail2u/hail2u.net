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
