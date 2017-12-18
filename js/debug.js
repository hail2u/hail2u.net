document.body.addEventListener("dblclick", () => {
  document.body.classList.toggle("js-debug-columns");
});
const eyecatch = document.querySelector(".fill");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;
  } else {
    eyecatch.hidden = true;
  }
});
document.body.addEventListener("dblclick", () => {
  document.body.classList.toggle("js-debug-elements");
});
