const csvParse = require("csv-parse/lib/sync");
const csvStringify = require("csv-stringify/lib/sync");
const { encode } = require("./html-entities");
const fs = require("fs");
const { isBinaryFileSync } = require("isbinaryfile");
const marked = require("marked");
const path = require("path");

let currentLevel = 1;

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

const ressurectMarkInCodeBlock = code => code.replace(/&lt;(\/)?mark&gt;/g, "<$1mark>");

const markupCodeBlock = (content, language) => {
  // The `content` is escaped only when `highlight` option is enabled.
  const escaped = ressurectMarkInCodeBlock(encode(content));

  if (!language) {
    return `<pre>${escaped}
</pre>
`;
  }

  return `<pre><code class="language-${encode(language)}">${escaped}
</code></pre>
`;
};

const dirDrafts = "../src/drafts/";
const included = [];

const markupContentBlock = content => {
  const filepath = path.resolve(dirDrafts, content.replace(/^\//, ""));

  if (
    !filepath.startsWith(path.resolve(dirDrafts)) ||
    !fs.existsSync(filepath) ||
    isBinaryFileSync(filepath)
  ) {
    return `<p>${content}</p>
`;
  }

  included.push(filepath);
  const filetype = path.extname(filepath).replace(/^\./, "");
  const filecontent = fs.readFileSync(filepath, "utf8");

  if (filetype === "csv") {
    const csv = csvParse(filecontent);
    const markdown = csvStringify(csv, {
      delimiter: "|"
    });
    return marked(markdown, {
      mangle: false
    });
  }

  return `<pre><code class="language-${filetype}">${ressurectMarkInCodeBlock(encode(filecontent))}</code></pre>
`;
};

const markupParagaraph = content => {
  if (content.startsWith("/")) {
    return markupContentBlock(content);
  }

  if (!/^<a\b.*?><img\b.*?><\/a>(\n<(figcaption)>.*?<\/\2>)?$/.exec(content)) {
    return `<p>${content}</p>
`;
  }

  return `<figure>
${content}
</figure>
`;
};

const markupBlockQuote = content => {
  const lines = content.trim().split("\n");

  if (!lines[lines.length - 1].startsWith("<p>—")) {
    return `<blockquote>
${lines.join("\n")}
</blockquote>
`;
  }

  const caption = lines.pop().replace(/<(\/)?p>/g, "<$1figcaption>");
  return `<figure>
<blockquote>
${lines.join("\n")}
</blockquote>
${caption}
</figure>
`;
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

const markupImage = (src, title, alt) => {
  if (title) {
    return `<img alt="${alt}" src="${src}" title="${title}">`;
  }

  return `<img alt="${alt}" src="${src}">`;
};

module.exports = markdown => {
  const html = marked(markdown, {
    mangle: false,
    renderer: Object.assign(new marked.Renderer(), {
      blockquote: markupBlockQuote,
      code: markupCodeBlock,
      heading: markupHeading,
      hr: markupThematicBreak,
      image: markupImage,
      link: markupLink,
      paragraph: markupParagaraph
    })
  })
    .trim()
    .replace(/>\n+(?=<)/g, ">\n")
    .replace(/\n+<(aside|blockquote|dl|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b/g, "\n\n<$1")
    .replace(/<(aside|blockquote|figure|section)>\n+(?=<)/g, "<$1>\n");
  return [html, included];
};
