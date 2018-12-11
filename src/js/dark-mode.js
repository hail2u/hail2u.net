const currentHour = new Date().getHours();

if (currentHour < 5 || currentHour > 18) {
  document.documentElement.classList.add("js-dark-mode");
}
