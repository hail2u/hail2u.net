const eyecatch = document.querySelector("body > main > article > h1 + figure");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;
  } else {
    eyecatch.hidden = true;
  }
});
