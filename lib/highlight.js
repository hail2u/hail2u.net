const hljs = require("highlight.js");
const { unescapeReferences } = require("./character-reference");

const codeRe = /<code class="language-(\w+?)">([\s\S]*?)<\/code>/g;

const highlightCode = (matched, language, code) => {
  const highlighted = hljs.highlight(language, unescapeReferences(code), true);
  return `<code class="hljs language-${language}">${highlighted.value}</code>`;
};

module.exports = html => html.replace(codeRe, highlightCode);
