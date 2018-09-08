/*!
 * heading-break.js
 * LICENSE: http://hail2u.mit-license.org/2018
 */
const addWordJoiner = (added, value, index) => {
  if (index > 3) {
    return `${value}${added}`;
  }

  return `${value}\u2060${added}`;
};

const headingBreak = () => {
  if (typeof RegExp.prototype.unicode !== "boolean") {
    return;
  }

  for (const heading of document.querySelectorAll("main > article > h1")) {
    heading.textContent = heading.textContent
      .match(/./gu)
      .reverse()
      .reduce(addWordJoiner);
  }
};

if (document.readyState !== "loading") {
  headingBreak();
} else {
  document.addEventListener("DOMContentLoaded", headingBreak);
}
