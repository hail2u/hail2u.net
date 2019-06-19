$(function () {
  $("form").submit(function () {
    var url = $("#from").val();
    var li = $("<li/>").faviconize(url).appendLink(url, url);
    $("#result").empty().append($("<ul/>").append(li));
    displayRelatedUrls(url, li, true);
    return false;
  });
  $("#result button").live("click", function () {
    var t = $(this).closest("li");
    var url = t.children("a").attr("href");
    $(this).remove();
    displayRelatedUrls(url, t, false);
  });
});

function displayRelatedUrls (url, target, isStart) {
  var ul = $("<ul/>");
  ul.append("<li><em>loading</em></li>");
  target.append(ul);
  $.getJSON("http://b.hatena.ne.jp/entry/json/?callback=?", {
    url: url
  }, function (d) {
    ul.empty();

    if (isStart) {
      target.empty().appendLink(d.url, d.title).append(" (" + d.count + " users)");
      target.append(ul);
    }

    $.each(d.related, function () {
      var li = $("<li/>").faviconize(this.url).appendLink(this.url, this.title).append(" (" + this.count + " users) ").append($("<button/>").append("Related"));
      ul.append(li);
    });
  });
}

$.fn.appendLink = function (url, title) {
  var link = $("<a/>").attr({
    href: url
  }).append(title);

  return this.append(link);
};

$.fn.faviconize = function (url) {
  return this.css({
    "background-image": "url(\"http://getfavicon.appspot.com/" + url + "\")"
  });
};
