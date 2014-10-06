// ==UserScript==
// @name           SimpldR
// @namespace      http://hail2u.net/
// @description    Simple + ldR = SimpldR
// @include        http://reader.livedoor.com/reader/*
// ==/UserScript==

GM_addStyle("*{font-family:'Lucida Grande','Lucida Sans Unicode',sans-serif;}pre,code,kbd,samp,var{font-family:Menlo,Consolas,monospace !important;}body img{max-width:100% !important;}.channel{background-color:#ffffff !important;}.channel a{color:#000000 !important;}.title{font-size:30px !important;}.channel_toolbar{padding-bottom: 1em !important;border-bottom: 1px solid #000000 !important;background-color: #ffffff !important;}.item{border-bottom:1px solid #000000 !important;}.even{background-color: #ffffff !important;}.hilight{background-color:#ffffff !important;}.item_title{font-size:18px !important;}.adsWrapper{display:none;}");

var execute = function (f) {
  location.href = "javascript:void (" + encodeURIComponent(f) + ")()";
};

execute(function () {
  // Go next/prev with mouse wheel
  var asobi = 6;
  var asobi_count = {};
  var reset_asobi = function () {
    asobi_count = {
      prev: 0,
      next: 0
    };
  };

  reset_asobi();

  var t = document.getElementById("right_container");

  t.addEventListener("mousewheel", function (e) {
    if (t.scrollTop === 0 && e.wheelDelta > 0) {
      asobi_count.prev++;
      asobi_count.next = 0;

      if (asobi_count.prev > asobi) {
        Control.read_prev_subs();
        e.preventDefault();
        e.stopPropagation();
        reset_asobi();

        return false;
      }
    }

    var remain = t.scrollHeight - t.clientHeight - t.scrollTop;

    if (writing_complete() && remain === 0 && e.wheelDelta < 0) {
      asobi_count.prev = 0;
      asobi_count.next++;

      if (asobi_count.next > asobi) {
        Control.read_next_subs();
        e.preventDefault();
        e.stopPropagation();
        reset_asobi();

        return false;
      }
    }
  }, false);

  register_hook("after_subs_load", function () {
    // Go fullscreen
    Control.toggle_fullscreen();
    Control.toggle_fullscreen();
    Control.toggle_leftpane();

    // Show first unread
    Control.read_head_subs();
  });
});
