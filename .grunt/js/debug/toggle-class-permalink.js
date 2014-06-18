document.getElementById('logo').addEventListener('click', function (e) {
  if (e.which === 1) {
    if (/\bpermalink\b/.test(document.body.className)) {
      document.body.className = document.body.className.replace(/ \bpermalink\b/, '');
    } else {
      document.body.className += ' permalink';
    }

    e.preventDefault();
  }
});
