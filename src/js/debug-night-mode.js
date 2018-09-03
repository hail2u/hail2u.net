document.querySelector("h1").addEventListener("click", e => {
  if (e.button === 0) {
    document.documentElement.classList.toggle("night");
    e.preventDefault();
  }
});
