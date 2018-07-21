const { decode, encode } = require("./html-entities");
const marked = require("marked");

const options = {
  headerIds: false
};
const sectionTags = ["aside", "figure", "section"];

const markupPreformattedText = (content, language, isEscaped) => {
  let escaped = content;

  if (!isEscaped) {
    escaped = encode(escaped).replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");
  }

  if (!language) {
    return `<pre>${escaped}
</pre>
`;
  }

  return `<pre><code class="language-${encode(language)}">${escaped}
</code></pre>
`;
};

const formatHTML = html =>
  html
    .trim()
    .replace(
      /\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g,
      "\n\n$1"
    )
    .replace(/<(aside|figure|section)></g, "<$1>\n<")
    .replace(/<blockquote>\n\n<p/g, "<blockquote>\n<p");

const markupHTML = html => {
  const tokens = html.trim().match(/^<(\w+)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return html;
  }

  const tag = tokens[1].toLowerCase();

  if (sectionTags.indexOf(tag) === -1) {
    return html;
  }

  return `<${tag}${tokens[2]}>
${formatHTML(marked(decode(tokens[3].trim()), options))}
</${tag}>
`;
};

const markupImage = (source, titleText, replacementText) =>
  `<img alt="${replacementText}" src="${source}">`;

const markupParagaraph = content => {
  if (/^(<img\s[^>]*|<a\s.*<\/a)>$/.exec(content)) {
    return `${content}
`;
  }

  return `<p>${content}</p>
`;
};

options.renderer = Object.assign(new marked.Renderer(), {
  code: markupPreformattedText,
  html: markupHTML,
  image: markupImage,
  paragraph: markupParagaraph
});

module.exports = t => formatHTML(marked(t, options));
