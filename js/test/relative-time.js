const relativeTimeContainer = document.querySelector(".test-relative-time");
[
  1000 * 60 * 60 * 24 * 30 * 12 * 6,
  1000 * 60 * 60 * 24 * 30 * 5,
  1000 * 60 * 60 * 24 * 4,
  1000 * 60 * 60 * 3,
  1000 * 60 * 2,
  1000 * 1
].forEach(diff => {
  const time = document.createElement("time");
  time.classList.add("js-relative-time");
  const dt = new Date(Date.now() - diff);
  time.setAttribute("datetime", dt.toJSON());
  time.append(dt.toLocaleString());
  const li = document.createElement("li");
  li.append(`${dt.toLocaleString()} => `);
  li.append(time);
  relativeTimeContainer.prepend(li);
});
