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
