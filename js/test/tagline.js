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

  if (tagline.dataset.taglinestatus === "default") {
    tagline.textContent = tagline.dataset.longtagline;
    tagline.dataset.longtagline = oldTagline;
    tagline.dataset.taglinestatus = "long";
    return;
  }

  if (tagline.dataset.taglinestatus === "long") {
    tagline.textContent = tagline.dataset.shorttagline;
    tagline.dataset.shorttagline = tagline.dataset.longtagline;
    tagline.dataset.longtagline = oldTagline;
    tagline.dataset.taglinestatus = "short";
    return;
  }

  tagline.textContent = tagline.dataset.shorttagline;
  tagline.dataset.shorttagline = oldTagline;
  tagline.dataset.taglinestatus = "default";
});
