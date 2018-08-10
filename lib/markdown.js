const { encode } = require("./html-entities");
const marked = require("marked");

const markupQuote = content => {
  const lines = content.trim().split("\n");

  if (!lines[lines.length - 1].startsWith("<p>—")) {
    return `<blockquote>
${lines.join("\n")}
</blockquote>
`;
  }

  lines.push(lines.pop().replace(/<(\/)?p>/g, "<$1figcaption>"));
  return `<figure>
<blockquote>
${lines.join("\n")}
</blockquote>
</figure>
`;
};

const markupPreformattedText = (content, language) => {
  // The `content` is escaped only when `highlight` option is enabled.
  const escaped = encode(content).replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");

  if (!language) {
    return `<pre>${escaped}
</pre>
`;
  }

  return `<pre><code class="language-${encode(language)}">${escaped}
</code></pre>
`;
};

let currentLevel = 1;

const markupHeading = (text, level) => {
  if (currentLevel === 1 && level === 1) {
    return `<h1>${text}</h1>
`;
  }

  if (currentLevel > 1 && level === currentLevel) {
    return `</section>
<section>
<h1>${text}</h1>
`;
  }

  if (currentLevel > 1 && level < currentLevel) {
    currentLevel = level;
    return `</section>
<h1>${text}</h1>
`;
  }

  currentLevel = level;
  return `<section>
<h1>${text}</h1>
`;
};

const markupThematicBreak = () => {
  if (currentLevel === 1) {
    return `<hr>
`;
  }

  currentLevel = currentLevel - 1;
  return `</section>
<hr>
`;
};

const markupImage = (src, title, alt) => {
  if (title) {
    return `<img alt="${alt}" src="${src}" title="${title}">`;
  }

  return `<img alt="${alt}" src="${src}">`;
};

const markupHyperlink = (href, title, content) => {
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
  if (!/^<a\b.*?><img\b.*?><\/a>(\n<(figcaption)>.*?<\/\1>)?$/.exec(content)) {
    return `<p>${content}</p>
`;
  }

  return `<figure>
${content}
</figure>
`;
};

module.exports = markdown =>
  marked(markdown, {
    breaks: true,
    gfm: true,
    headerIds: false,
    renderer: Object.assign(new marked.Renderer(), {
      blockquote: markupQuote,
      code: markupPreformattedText,
      heading: markupHeading,
      hr: markupThematicBreak,
      image: markupImage,
      link: markupHyperlink,
      paragraph: markupParagaraph
    }),
    tables: true
  })
    .trim()
    .replace(/>\n+(?=<)/g, ">\n")
    .replace(
      /\n+<(aside|blockquote|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b/g,
      "\n\n<$1"
    )
    .replace(/<(aside|blockquote|figure|section)>\n+(?=<)/g, "<$1>\n");
