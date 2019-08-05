const tagline = document.querySelector("p");

document.getElementById("test-tagline-length").addEventListener("click", () => {
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

  if (tagline.dataset.taglinestatus === "short") {
    tagline.hidden = true;
    tagline.dataset.taglinestatus = "hidden";
    return;
  }

  tagline.hidden = false;
  tagline.textContent = tagline.dataset.shorttagline;
  tagline.dataset.shorttagline = oldTagline;
  tagline.dataset.taglinestatus = "default";
});
