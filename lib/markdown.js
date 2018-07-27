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

const markupLink = (href, titleText, text) => {
  if (!titleText) {
    return `<a href="${href}">${text}</a>`;
  }

  return `<a href="${href}">${text}</a>
<figcaption>${titleText}</figcaption>`;
};

const markupParagaraph = content => {
  if (
    /^(<a\s[^>]*>)<img\s[^>]*>(<\/a>)(\n<figcaption>[^<]*<\/figcaption>)?$/.exec(
      content
    )
  ) {
    return `<figure>
${content}
</figure>
`;
  }

  return `<p>${content}</p>
`;
};

options.renderer = Object.assign(new marked.Renderer(), {
  code: markupPreformattedText,
  html: markupHTML,
  image: markupImage,
  link: markupLink,
  paragraph: markupParagaraph
});

module.exports = t => formatHTML(marked(t, options));
