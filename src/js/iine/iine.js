/**
 * @preserve iine.js
 *
 * LICENSE: http://hail2u.mit-license.org/2011
 */
(function (d) {
  var placeholder = d.getElementById('iine');

  if (!placeholder) return;

  window.displayIine = function (data) {
    function txt(str) {
      var a = d.createElement('a');
      a.appendChild(d.createTextNode(str));

      return a.innerHTML;
    }

    var buf = ['<h1><a href="http://iine.hail2u.net/"><img src="/images/iine-favicon.min.svg" alt="Iine!"></a></h1>'];

    if (data === undefined || data.query.results === null) {
      buf.push('<p class="message-error">\u30c7\u30fc\u30bf\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002</p>');
      placeholder.innerHTML = buf.join('');

      return;
    }

    buf.push('<ol>');
    var items = data.query.results.item;

    for (var i = 0, l = (items.length > 3) ? 3 : items.length; i < l; i++) {
      var item = items[i];
      var desc = item.description;
      var link = desc.replace(/^[\s\S]*?<a href="([\s\S]*?)"[\s\S]*$/, "$1");
      var image = desc.replace(/^[\s\S]*?<img src="([\s\S]*?)"[\s\S]*$/, "$1");
      buf.push(
        '<li>',
          '<a href="' + txt(link) + '">',
            '<figure>',
              '<img src="' + txt(image) + '">',
              '<figcaption>',
                txt(item.title),
              '</figcaption>',
            '</figure>',
          '</a>',
        '</li>'
      );
    }

    buf.push(
      '</ol>',
      '<p>Iine! is a collection of impressive logo, texture,<br> typography, and any other widget on <abbr>WWW</abbr>. <a href="http://iine.hail2u.net/">See more »</a></p>'
    );

    placeholder.innerHTML = buf.join('');
    delete window.displayIine;
  };

  var js = d.createElement('script');
  var s = d.getElementsByTagName('script')[0];

  js.async = true;
  js.src = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20rss%20where%20url%3D"http%3A%2F%2Fiine.hail2u.net%2Ffeed"&format=json&callback=displayIine';
  s.parentNode.insertBefore(js, s);
})(document);
