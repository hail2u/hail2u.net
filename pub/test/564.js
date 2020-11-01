NodeList.prototype.forEach = Array.prototype.forEach;

function insertCode(url, to) {
  to.innerHTML = 'Loading...';
  var req = new XMLHttpRequest();
  req.open('get', url, true);
  req.addEventListener('load', function () {
    var top = to.parentNode;

    var pre = document.createElement('pre');
    top.insertBefore(pre, to);

    var code = document.createElement('code');
    code.textContent = req.responseText;
    pre.appendChild(code);

    top.removeChild(to);
  }, false);
  req.send();
}

if (window.innerWidth >= 800 && window.innerHeight >= 600) {
  document.querySelectorAll('p.code-ref > a').forEach(function (code_ref) {
    insertCode(code_ref.href, code_ref.parentNode);
  });
}
