const tagline = document.querySelector("body > header > p");

document.querySelector("main h1").addEventListener("click", () => {
  if (tagline.hidden) {
    tagline.hidden = false;

    if (tagline.dataset.multi === "yes") {
      tagline.nextElementSibling.hidden = false;
    }

    return;
  }

  tagline.hidden = true;

  if (tagline.dataset.multi === "yes") {
    tagline.nextElementSibling.hidden = true;
  }
});

tagline.addEventListener("click", () => {
  if (tagline.dataset.multi === "yes") {
    tagline.parentNode.removeChild(tagline.parentNode.lastChild);
    tagline.dataset.multi = "no";

    return;
  }

  tagline.parentNode.appendChild(tagline.cloneNode(true));
  tagline.dataset.multi = "yes";
});
