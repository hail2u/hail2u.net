"use strict";

document.body.addEventListener("dblclick", () => {
  document.body.classList.toggle("js-debug-columns");
});
"use strict";

const eyecatch = document.querySelector(".fill");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;
  } else {
    eyecatch.hidden = true;
  }
});
"use strict";

document.body.addEventListener("dblclick", () => {
  document.body.classList.toggle("js-debug-elements");
});
