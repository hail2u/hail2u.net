document.getElementById('introduction').addEventListener('click', function (e) {
  if (e.which === 1 && e.target.tagName.toLowerCase() !== 'a') {
    var body = document.body;
    var eyecatch = document.getElementById('eyecatch');

    if (/\bhas-image\b/.test(body.className)) {
      eyecatch.style.display = 'none';
      body.className = body.className.replace(/\s?\bhas-image\b/, '');
    } else {
      eyecatch.style.display = 'block';
      body.className += ' has-image';
    }

    e.preventDefault();
  }
}, false);
