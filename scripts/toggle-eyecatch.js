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
