"use strict";

window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("dblclick", () => {
    document.body.classList.toggle("js-debug-elements");
  });
});
