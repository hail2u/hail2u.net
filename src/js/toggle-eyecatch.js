"use strict";

const eyecatch = document.querySelector(".fill");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;
  } else {
    eyecatch.hidden = true;
  }
}, false);
