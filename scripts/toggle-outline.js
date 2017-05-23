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
