const tagline = document.querySelector("body > header > p");
const taglineDebugClass = "js-debug-multiline-tagline";

document.querySelector("main h1").addEventListener("click", () => {
  if (tagline.hidden) {
    tagline.hidden = false;

    if (tagline.classList.contains(taglineDebugClass)) {
      tagline.nextElementSibling.hidden = false;
    }

    return;
  }

  tagline.hidden = true;

  if (tagline.classList.contains(taglineDebugClass)) {
    tagline.nextElementSibling.hidden = true;
  }
});

tagline.addEventListener("click", () => {
  tagline.classList.toggle(taglineDebugClass);

  if (!tagline.classList.contains(taglineDebugClass)) {
    tagline.parentNode.removeChild(tagline.parentNode.lastChild);

    return;
  }

  tagline.parentNode.appendChild(tagline.cloneNode(true));
});
