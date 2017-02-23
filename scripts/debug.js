"use strict";

document.body.addEventListener("dblclick", (e) => {
  e.target.classList.toggle("js-debug-columns");
}, false);
"use strict";

const eyecatch = document.querySelector(".fill");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;
  } else {
    eyecatch.hidden = true;
  }
}, false);
"use strict";

document.body.addEventListener("dblclick", (e) => {
  e.target.classList.toggle("js-debug-elements");
}, false);
