document.body.addEventListener('dblclick', function () {
  if (/\bshow-column\b/.test(this.className)) {
    this.className = this.className.replace(/ \bdebug\b/, '');
  } else {
    this.className += ' show-column';
  }
}, false);
