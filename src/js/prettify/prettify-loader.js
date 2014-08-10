/**
 * @preserve prettify-loader.js
 *
 * LICENSE: http://hail2u.mit-license.org/2011
 */
document.addEventListener('readystatechange', function () {
  var languages = ['bash', 'bsh', 'c', 'cc', 'coffee', 'cpp', 'cs', 'csh',
    'cxx', 'cyc', 'cv', 'htm', 'html', 'java', 'javascript', 'js', 'json',
    'm', 'mxml', 'perl', 'pl', 'pm', 'py', 'python', 'rb', 'rc', 'rs', 'ruby',
    'rust', 'sh', 'xhtml', 'xml', 'xsl'];
  languages.push('conf', 'config', 'css', 'sass', 'scss', 'vim');
  var reLanguage = new RegExp('\\blanguage-(' + languages.join('|') + ')\\b');
  var codes = document.querySelectorAll('code[class*=language-]');

  if (codes) {
    for (var i = 0, l = codes.length; i < l; i++) {
      var code = codes[i];
      var parent = code.parentNode;

      if (parent.tagName.toLowerCase() === 'pre' && reLanguage.test(code.className)) {
        parent.className += ' prettyprint';
      }
    }

    prettyPrint();
  }
});
