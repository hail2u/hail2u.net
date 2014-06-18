document.body.addEventListener('dblclick', function () {
  if (/\bdebug\b/.test(this.className)) {
    this.className = this.className.replace(/ \bdebug\b/, '');
  } else {
    this.className += ' debug';
  }
});
