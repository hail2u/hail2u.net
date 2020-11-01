/**
 * highlight-search-terms.js
 *
 * Copyright (c) 2009 Kyo Nagashima <kyo@hail2u.net>
 * This library licensed under MIT license:
 * http://opensource.org/licenses/mit-license.php
 */
$(function () {
  var ref = document.referrer;

  if (ref) {
    var referrerPattern = [
      "^http://www\.google\.com.+[&?]q=([^&]+).*$",
      "^http://www\.google\.co\.jp.+[&?]q=([^&]+).*$",
      "^http://search\.yahoo\.com.+[&?]p=([^&]+).*$",
      "^http://search\.yahoo\.co\.jp.+[&?]p=([^&]+).*$",
      "^http://www\.bing\.com.+[&?]q=([^&]+).*$",
      "^http://hail2u\.net.+[&?]q=([^&]+).*$"
    ];
    var unsafechars = /[!-*,-\/:-@[-`{-~]/g;

    // extract words from referrer URL
    var words;
    $.each(referrerPattern, function () {
      var pattern = new RegExp(this, "i");

      if (pattern.exec(ref)) {
        var query = decodeURIComponent(RegExp.$1).replace(unsafechars, "+").replace(/^\+*(.*?)\+*$/, "$1").replace(/\++/g, "|");
        words = new RegExp("(" + query + ")", "gi");
        return false; // break $.each
      }
    });

    // Hilight words
    try {
      $("#contents > .section *").not("iframe").contents().each(function () {
        if (this.nodeType === 3) {
          var s = this.nodeValue.replace(words, "<em class=\"highlight\">$1</em>");
          $(this).replaceWith(s);
        }
      });
    } catch (e) {
      // console.log(e.message);
    }
  }
});
