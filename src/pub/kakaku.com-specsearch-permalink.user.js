// ==UserScript==
// @name           Kakaku.com specsearch permalink
// @namespace      http://hail2u.net/
// @description    Insert a permalink to Kakaku.com specsearch result page.
// @include        http://kakaku.com/specsearch/*
// ==/UserScript==

// console.time("insert-spec-search-permalink");

var permalink = "";

Array.forEach(document.getElementsByTagName("a"), function (a) {
  if (a.href.match(/^mailto:\?body=/)) {
    permalink = decodeURIComponent(a.href.replace(/^mailto:\?body=/,""));
    return;
  }
});

if (permalink) {
  var h1 = document.getElementsByTagName("h1")[0];
  h1.appendChild(document.createTextNode(" "));
  var a = document.createElement("a");
  a.setAttribute("href", permalink);
  a.style.color = "#ff6600";
  a.appendChild(document.createTextNode("#"));
  h1.appendChild(a);
}

// console.timeEnd("insert-spec-search-permalink");
