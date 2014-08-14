document.getElementById('logo').addEventListener('click', function (e) {
  if (e.which === 1) {
    var body = document.body;

    if (/\bpermalink\b/.test(body.className)) {
      body.className = body.className.replace(/ \bpermalink\b/, '');
    } else {
      body.className += ' permalink';
    }

    e.preventDefault();
  }
}, false);
