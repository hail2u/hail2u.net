"use strict";

window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("dblclick", () => {
    document.body.classList.toggle("js-debug-columns");
  });
});
"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const eyecatch = document.querySelector(".fill");

  document.querySelector("footer").addEventListener("click", () => {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }
  });
});
"use strict";

window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("dblclick", () => {
    document.body.classList.toggle("js-debug-elements");
  });
});
