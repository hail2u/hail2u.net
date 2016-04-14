(function (d) {
  "use strict";

  function toggle(eyecatch, article, evt) {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }

    evt.preventDefault();
    evt.stopPropagation();
    article.classList.toggle("has-image");
  }

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
