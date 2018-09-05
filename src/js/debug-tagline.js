const tagline = document.querySelector("p");

document.querySelector("main h1").addEventListener("click", () => {
  if (tagline.hidden) {
    tagline.hidden = false;
    return;
  }

  tagline.hidden = true;
});

tagline.addEventListener("click", () => {
  const oldTagline = tagline.textContent;
  tagline.textContent = tagline.dataset.longtagline;
  tagline.dataset.longtagline = oldTagline;
});
