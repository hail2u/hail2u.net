if (window.innerWidth >= 800 && window.innerHeight >= 600) {
  var code_refs = document.querySelectorAll('p.code-ref > a');

  for (var i = 0, l = code_refs.length; i < l; i++) {
    var code_ref = code_refs[i];
    insertCode(code_ref.href, code_ref.parentNode);
  }
}

function insertCode(url, to) {
  to.innerHTML = 'Loading...';
  var req = new XMLHttpRequest();
  req.open('get', url, true);
  req.addEventListener('load', function () {
    var code = document.createElement('code');
    code.appendChild(document.createTextNode(req.responseText));
    var pre = document.createElement('pre');
    pre.appendChild(code);
    var top = to.parentNode;
    top.insertBefore(pre, to);
    top.removeChild(to);
  }, false);
  req.send();
}
