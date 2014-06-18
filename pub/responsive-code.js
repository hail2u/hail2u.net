var replaceLinkWithCode = function (codeURL, codeRef) {
  var request = new XMLHttpRequest();
  request.open('get', codeURL, true);
  request.addEventListener('load', function () {
    var parent = codeRef.parentNode;

    var pre = document.createElement('pre');
    parent.insertBefore(pre, codeRef);

    var code = document.createElement('code');
    code.textContent = request.responseText;
    pre.appendChild(code);

    parent.removeChild(codeRef);
  }, false);
  request.send();
};

if (window.innerWidth >= 800 && window.innerHeight >= 600) {
  var codeLinks = document.querySelectorAll('p.code-ref > a');

  for (var i = 0, l = codeLinks.length; i < l; i++) {
    var codeLink = codeLinks[i];
    replaceLinkWithCode(codeLink.href, codeLink.parentNode);
  }
}
