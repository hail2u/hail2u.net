/**
 * @preserve popular-pages.js
 *
 * LICENSE: http://hail2u.mit-license.org/2013
 */
(function () {
  var placeholder = document.getElementById('popular-pages');

  if (!placeholder) {
    return;
  }

  window.displayPopularPages = function (data) {
    function txt(str) {
      var a = document.createElement('a');
      a.appendChild(document.createTextNode(str));

      return a.innerHTML;
    }

    var buf = ['<h1>\u4EBA\u6C17\u306E\u3042\u308B\u30DA\u30FC\u30B8</h1>'];

    if (data === undefined || data.query.results === null) {
      buf.push('<p class="message-error">\u30c7\u30fc\u30bf\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002</p>');
      placeholder.innerHTML = buf.join('');

      return;
    }

    var items = data.query.results.item;
    buf.push('<ol>');

    for (var i = 0, l = 10; i < l; i++) {
      var item = items[i];
      buf.push(
        '<li>',
          '<a href="' + txt(item.link) + '">',
            txt(item.title.replace(/^hail2u\.net - Weblog - /, '').replace(/ - Weblog - hail2u\.net$/, '')),
          '</a>',
        '</li>'
      );
    }

    buf.push(
      '</ol>',
      '<nav class="seemore">',
        '<p><a href="http://b.hatena.ne.jp/entrylist?sort=count&amp;url=http%3A%2F%2Fhail2u.net%2F">\u3082\u3063\u3068\u898B\u308B\u000A</a></p>',
      '</nav>'
    );
    placeholder.innerHTML = buf.join('');
    delete window.displayPopularPages;
  };

  var js = document.createElement('script');
  var s = document.getElementsByTagName('script')[0];

  js.async = true;
  js.src = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20feed%20where%20url%3D"http%3A%2F%2Fb.hatena.ne.jp%2Fentrylist%3Fsort%3Dcount%26url%3Dhttp%253A%252F%252Fhail2u.net%252F%26mode%3Drss"&format=json&callback=displayPopularPages';
  s.parentNode.insertBefore(js, s);
})();
