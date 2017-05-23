"use strict";

const toggleColumn = () => {
  document.body.addEventListener("dblclick", () => {
    document.body.classList.toggle("js-debug-columns");
  });
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", toggleColumn);
} else {
  toggleColumn();
}
"use strict";

const toggleEyecatch = () => {
  const eyecatch = document.querySelector(".fill");

  document.querySelector("footer").addEventListener("click", () => {
    if (eyecatch.hidden) {
      eyecatch.hidden = false;
    } else {
      eyecatch.hidden = true;
    }
  });
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", toggleEyecatch);
} else {
  toggleEyecatch();
}
"use strict";

const toggleOutline = () => {
  document.body.addEventListener("dblclick", () => {
    document.body.classList.toggle("js-debug-elements");
  });
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", toggleOutline);
} else {
  toggleOutline();
}
