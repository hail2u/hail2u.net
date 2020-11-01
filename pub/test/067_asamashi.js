/* ---------------------------------------------------------------------
Copyright (c) 2006 Kyo Nagashima <kyo@hail2u.net>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
--------------------------------------------------------------------- */

function onDemandJavaScript() {
  this.head = document.getElementsByTagName('head').item(0);
}

onDemandJavaScript.prototype = {
  request: function (url, callback, callbackParamName) {
    var self = this;
    var i = onDemandJavaScript.counter++;

    onDemandJavaScript.jsonpCallbacks[i] = function() {
      delete onDemandJavaScript.jsonpCallbacks[i];
      callback.apply(self, arguments);
    }

    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url + (url.indexOf('?') > 0 ? '&' : '?') + 'nocache=' + (new Date()).getTime() + '&' + callbackParamName + '=' + encodeURIComponent("onDemandJavaScript.jsonpCallbacks[" + i + "]"));
    script.setAttribute("charset", "UTF-8");
    this.head.appendChild(script);
  }
};

onDemandJavaScript.counter = 0;
onDemandJavaScript.jsonpCallbacks = [];


var tmpl = new Template('<div class="asamashi"><p class="image"><a href="#{itemUrl}"><img alt="#{itemTitle}" src="#{itemMediumImageUrl}" width="#{itemMediumImageWidth}" height="#{itemMediumImageHeight}" /></a></p><h4 class="title"><a href="#{itemUrl}">#{itemTitle}</a></h4><ul><li>#{itemCreator}</li><li>#{itemPublisher}</li><li>#{itemReleaseDate}</li><li>#{itemPrice}</li></ul></div>');

var AccessKeyId = '08PWFCAAQ5TZJT30SKG2';
var xslUrl  = 'http://labs.hail2u.net/amazon/itemlookup.xsl';

var asamashi, asin, aid;


/**
 * This code block is inspired by script.aculo.us 1.6.1.
 * Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
 */
$A(document.getElementsByTagName("script")).findAll(function(s) {
  return (s.src && s.src.match(/067_asamashi\.js$/))
}).each(function(s) {
  var classes = s.parentNode.className.split(' ');
  asin = classes[0];
  aid = classes[1];
  s.parentNode.setAttribute('id', 'i' + asin);
});


var url = 'http://webservices.amazon.co.jp/onca/xml' +
  '?AWSAccessKeyId=' + AccessKeyId +
  '&AssociateTag=' + aid +
  '&Service=AWSECommerceService' +
  '&Version=2006-06-28' +
  '&ContentType=text/javascript' +
  '&Style=' + xslUrl +
  '&Operation=ItemLookup' +
  '&ResponseGroup=Medium' +
  '&ItemId=' + asin;
var odj = new onDemandJavaScript();
odj.request(url, cbItemLookup, 'callback');


function cbItemLookup(ItemLookupResponse) {
  var asamashi = $('i' + asin);

  try {
    var items = ItemLookupResponse.Items;
  } catch (e) {
    asamashi.innerHTML = '<p>処理中にエラーが発生しました: <em>' + e + '</em></p>';
    return;
  }

  if (ItemLookupResponse.Error > 0) {
    asamashi.innerHTML = '<p>' + ItemLookupResponse.ErrorMessage + ': <em>' + ItemLookupResponse.ErrorCode + '</em></p>';
    return;
  }

  var item = ItemLookupResponse.Items[0];
  asamashi = $('i' + item.ASIN);
  var data = {
    itemId:           item.ASIN,
    itemUrl:          item.URL,
    itemTitle:        item.Title,
    itemCreator:      item.Creator,
    itemPublisher:    item.Publisher,
    itemReleaseDate:  item.ReleaseDate,
    itemPrice:        item.Price,
    itemProductGroup: item.ProductGroup
  };

  if (item.SmallImage) {
    data.itemSmallImageUrl    = item.SmallImage.URL;
    data.itemSmallImageWidth  = item.SmallImage.Width;
    data.itemSmallImageHeight = item.SmallImage.Height;
  } else {
    data.itemSmallImageUrl    = 'http://labs.hail2u.net/amazon/no-image.png';
    data.itemSmallImageWidth  = 60;
    data.itemSmallImageHeight = 40;
  }

  if (item.MediumImage) {
    data.itemMediumImageUrl    = item.MediumImage.URL;
    data.itemMediumImageWidth  = item.MediumImage.Width;
    data.itemMediumImageHeight = item.MediumImage.Height;
  } else {
    data.itemMediumImageUrl    = 'http://labs.hail2u.net/amazon/no-image.png';
    data.itemMediumImageWidth  = 60;
    data.itemMediumImageHeight = 40;
  }

  if (item.LargeImage) {
    data.itemLargeImageUrl    = item.LargeImage.URL;
    data.itemLargeImageWidth  = item.LargeImage.Width;
    data.itemLargeImageHeight = item.LargeImage.Height;
  } else {
    data.itemLargeImageUrl    = 'http://labs.hail2u.net/amazon/no-image.png';
    data.itemLargeImageWidth  = 60;
    data.itemLargeImageHeight = 40;
  }

  asamashi.innerHTML = tmpl.evaluate(data);
}
