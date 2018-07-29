const { decode, encode } = require("./html-entities");
const marked = require("marked");

const convertToAttribution = (line, index, array) => {
  if (index !== array.length - 1 || !line.startsWith("<p>—")) {
    return line;
  }

  return line.replace(/\bp(?=>)/g, "figcaption");
};

const markupBlockquote = content => {
  const lines = content
    .trim()
    .split("\n")
    .map(convertToAttribution);

  if (!lines[lines.length - 1].endsWith("</figcaption>")) {
    return `<blockquote>
${lines.join("\n")}
</blockquote>
`;
  }

  return `<figure>
<blockquote>
${lines.join("\n")}
</blockquote>
</figure>
`;
};

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

const options = {};

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

  if (!content.startsWith("<img ")) {
    return `<a href="${href}" title="${title}>${content}</a>`;
  }

  return `<a href="${href}">${content}</a>
<figcaption>${title}</figcaption>`;
};

const markupParagaraph = content => {
  if (/^<a\b.*?><img\b.*?><\/a>(\n<(figcaption)>.*?<\/\1>)?$/.exec(content)) {
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
    .replace(/>\n+(?=<)/g, ">\n")
    .replace(
      /\n+<(blockquote|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b/g,
      "\n\n<$1"
    )
    .replace(/<(blockquote|figure|section)>\n+(?=<)/g, "<$1>\n");

options.renderer = Object.assign(new marked.Renderer(), {
  blockquote: markupBlockquote,
  code: markupPreformattedText,
  heading: markupHeading,
  html: markupHTML,
  image: markupImage,
  link: markupLink,
  paragraph: markupParagaraph
});

module.exports = t => formatHTML(marked(t, options));
