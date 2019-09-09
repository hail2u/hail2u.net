const { decode } = require("./html-entities");
const hljs = require("highlight.js");

const reCode = /<code class="language-(\w+?)">([\s\S]*?)<\/code>/g;

const highlightCode = (matched, language, code) => {
  const highlighted = hljs.highlight(language, decode(code), true);
  return `<code class="hljs language-${language}">${highlighted.value}</code>`;
};

module.exports = html => html.replace(reCode, highlightCode);
