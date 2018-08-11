/*!
 * title-break.js
 * LICENSE: http://hail2u.mit-license.org/2016
 */

const addWordJoiner = (added, value, index) => {
  if (index > 3) {
    return `${value}${added}`;
  }

  return `${value}\u2060${added}`;
};

for (const heading of document.querySelectorAll("main > article > h1")) {
  heading.textContent = heading.textContent
    .split("")
    .reverse()
    .reduce(addWordJoiner);
}
