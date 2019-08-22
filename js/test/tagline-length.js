const tagline = document.querySelector("body > header h1");

document.getElementById("test-tagline-length").addEventListener("click", () => {
  const oldTagline = tagline.textContent;

  if (tagline.dataset.status === "default") {
    tagline.textContent = tagline.dataset.long;
    tagline.dataset.long = oldTagline;
    tagline.dataset.status = "long";
    return;
  }

  if (tagline.dataset.status === "long") {
    tagline.textContent = tagline.dataset.short;
    tagline.dataset.short = tagline.dataset.long;
    tagline.dataset.long = oldTagline;
    tagline.dataset.status = "short";
    return;
  }

  if (tagline.dataset.status === "short") {
    tagline.hidden = true;
    tagline.dataset.status = "hidden";
    return;
  }

  tagline.hidden = false;
  tagline.textContent = tagline.dataset.short;
  tagline.dataset.short = oldTagline;
  tagline.dataset.status = "default";
});
