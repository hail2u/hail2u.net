(function () {
  var version = window.getComputedStyle(document.querySelector('html'), '::after').getPropertyValue('content');
  document.querySelectorAll('h1')[1].textContent += ' v' + version.replace(/["']/g, '');
})();
