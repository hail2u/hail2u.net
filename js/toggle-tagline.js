const tagline = document.querySelector("body > header > p");

document.querySelector("main h1").addEventListener("click", () => {
  if (tagline.hidden) {
    tagline.hidden = false;

    return;
  }

  tagline.hidden = true;
});
