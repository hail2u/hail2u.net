/**
 * @preserve lightbox.js
 *
 * LICENSE: http://hail2u.mit-license.org/2015
 */
(function () {
  "use strict";

  var i;
  var images = document.querySelectorAll([
    ".content img[src^=\"assets/images/\"]",
    ".content img[src^=\"/images/\"]"
  ].join(","));
  var l = images.length;
  var left = 1;
  var node;

  function toggle(evt) {
    var a;
    var img = evt.srcElement;

    if (evt.which !== left) {
      return;
    }

    evt.preventDefault();
    a = img.parentNode;

    if (a.style.cssText && img.style.cssText) {
      if (img.originalsrc) {
        img.src = img.originalsrc;
        delete img.originalsrc;
      }

      a.style.cssText = "";
      img.style.cssText = "";

      return;
    }

    if (a.href !== img.src) {
      img.originalsrc = img.src;
      img.src = a.href;
    }

    a.style.backgroundColor = "#fff";
    a.style.cursor = "zoom-out";
    a.style.height = "100vh";
    a.style.left = "0";
    a.style.position = "fixed";
    a.style.top = "0";
    a.style.width = "100vw";
    a.style.zIndex = "100";
    img.style.bottom = "0";
    img.style.height = "auto";
    img.style.left = "0";
    img.style.margin = "auto";
    img.style.maxHeight = "96%";
    img.style.maxWidth = "96%";
    img.style.position = "absolute";
    img.style.right = "0";
    img.style.top = "0";
    img.style.width = "auto";
  }

  for (i = 0; i < l; i += 1) {
    node = images[i].parentNode;

    if (
      node.tagName === "A" &&
      /^(assets)?\/images\//.test(node.getAttribute("href"))
    ) {
      node.addEventListener("click", toggle, false);
    }
  }
})();
