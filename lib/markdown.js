const { decode, encode } = require("./html-entities");
const marked = require("marked");

const renderer = new marked.Renderer();
const options = {};

const markupPreformattedText = (content, language, isEscaped) => {
  let escaped = content;

  if (!isEscaped) {
    escaped = encode(escaped).replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");
  }

  if (!language) {
    return `<pre>${escaped}</pre>
`;
  }

  return `<pre><code class="language-${encode(
    language
  )}">${escaped}</code></pre>
`;
};

const markupHeading = (text, level) => `<h${level}>${text}</h${level}>
`;

const markupHTML = html => {
  const tokens = html.trim().match(/^<(figure|section)(.*?)>([\s\S]*)<\/\1>/);

  if (!tokens) {
    return html;
  }

  const tag = tokens[1].toLowerCase();
  return `<${tag}${tokens[2]}>
${marked(decode(tokens[3].trim()), options)}
</${tag}>
`;
};

const markupImage = (source, title, alt) => {
  if (title) {
    return `<img alt="${alt}" src="${source}" title="${title}">`;
  }

  return `<img alt="${alt}" src="${source}">`;
};

const markupLink = (href, title, content) => {
  if (!title) {
    return `<a href="${href}">${content}</a>`;
  }

  return `<a href="${href}">${content}</a>
<figcaption>${title}</figcaption>`;
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

const formatHTML = html =>
  html
    .trim()
    .replace(/>\n+</g, ">\n<")
    .replace(
      /\n+(<(aside|blockquote|div|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g,
      "\n\n$1"
    )
    .replace(/<(figure|section)>\n*</g, "<$1>\n<")
    .replace(/<blockquote>\n*</g, "<blockquote>\n<");

renderer.code = markupPreformattedText;
renderer.heading = markupHeading;
renderer.html = markupHTML;
renderer.image = markupImage;
renderer.link = markupLink;
renderer.paragraph = markupParagaraph;
options.renderer = renderer;

module.exports = t => formatHTML(marked(t, options));
