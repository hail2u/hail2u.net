const eyecatch = document.querySelector("figure");

document.querySelector("footer").addEventListener("click", () => {
  if (eyecatch.hidden) {
    eyecatch.hidden = false;

    return;
  }

  eyecatch.hidden = true;
});
