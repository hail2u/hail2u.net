(function (d) {
  "use strict";

  var toggle = function (eyecatch, article, evt) {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }

    article.classList.toggle("has-image");
    evt.preventDefault();
    evt.stopPropagation();
  };

  d.querySelector(".section-footer").addEventListener(
    "click",
    toggle.bind(
      null,
      d.querySelector(".fill"),
      d.getElementById("introduction")
    ),
    false
  );
})(document);
