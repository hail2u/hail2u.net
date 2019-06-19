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

var AssociateTag = 'hail2unet-22';
var tmpl = new Template('<div class="asamashi"><p class="image"><a href="#{itemUrl}"><img alt="#{itemTitle}" src="#{itemMediumImageUrl}" width="#{itemMediumImageWidth}" height="#{itemMediumImageHeight}" /></a></p><h4 class="title"><a href="#{itemUrl}">#{itemTitle}</a></h4><ul><li>#{itemCreator}</li><li>#{itemPublisher}</li><li>#{itemReleaseDate}</li><li>#{itemPrice}</li></ul></div>');

var AccessKeyId = '08PWFCAAQ5TZJT30SKG2';
var xslUrl  = 'http://labs.hail2u.net/amazon/itemlookup.xsl';

var asin;


// ---------------------------------------------------------------------
// This code block is inspired by script.aculo.us 1.6.1.
// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
$A(document.getElementsByTagName("script")).findAll(function(s) {
  return (s.src && s.src.match(/056_asamashi\.js(\#.*)?$/))
}).each(function(s) {
  asin = s.src.replace(/http:\/\/hail2u\.net\/pub\/test\/056_asamashi\.js\#/, '');
});
// ---------------------------------------------------------------------


var url = 'http://webservices.amazon.co.jp/onca/xml' +
  '?AWSAccessKeyId=' + AccessKeyId +
  '&AssociateTag=' + AssociateTag +
  '&Service=AWSECommerceService' +
  '&Version=2006-06-28' +
  '&ContentType=text/javascript' +
  '&Style=' + xslUrl +
  '&Operation=ItemLookup' +
  '&ResponseGroup=Medium' +
  '&ItemId=' + asin;

var oJsr = new jsonScriptRequest();
oJsr.build(url);
oJsr.add();

function cbItemLookup(ItemLookupResponse) {
  var asamashi = document.getElementById('asamashi-' + asin);

  try {
    var items = ItemLookupResponse.Items;
  } catch (e) {
    asamashi.innerHTML = '<p>処理中にエラーが発生しました: <em>' + e + '</em></p>';
    oJsr.remove();
    return;
  }

  if (ItemLookupResponse.Error > 0) {
    asamashi.innerHTML = '<p>' + ItemLookupResponse.ErrorMessage + ': <em>' + ItemLookupResponse.ErrorCode + '</em></p>';
    oJsr.remove();
    return;
  }

  var item = ItemLookupResponse.Items[0];
  asamashi.innerHTML = tmpl.evaluate({
    itemId:                item.ASIN,
    itemUrl:               item.URL,
    itemTitle:             item.Title,
    itemCreator:           item.Creator,
    itemPublisher:         item.Publisher,
    itemReleaseDate:       item.ReleaseDate,
    itemPrice:             item.Price,
    itemProductGroup:      item.ProductGroup,
    itemSmallImageUrl:     item.SmallImage.URL,
    itemSmallImageWidth:   item.SmallImage.Width,
    itemSmallImageHeight:  item.SmallImage.Height,
    itemMediumImageUrl:    item.MediumImage.URL,
    itemMediumImageWidth:  item.MediumImage.Width,
    itemMediumImageHeight: item.MediumImage.Height,
    itemLargeImageUrl:     item.LargeImage.URL,
    itemLargeImageWidth:   item.LargeImage.Width,
    itemLargeImageHeight:  item.LargeImage.Height
  });

  oJsr.remove();
}
