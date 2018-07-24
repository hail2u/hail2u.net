const tagline = document.querySelector("body > header > p");

document.querySelector("main h1").addEventListener("click", () => {
  if (tagline.hidden) {
    tagline.hidden = false;

    return;
  }

  tagline.hidden = true;
});

tagline.addEventListener("click", () => {
  const current = tagline.textContent;
  const next = tagline.dataset.long;
  tagline.textContent = next;
  tagline.dataset.long = current; 
});
