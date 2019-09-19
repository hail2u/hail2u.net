const config = require("./index.json");
const { decodeHTMLEntities } = require("../lib/html-entities");
const fs = require("fs").promises;
const highlight = require("../lib/highlight");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json-file");
const readline = require("readline");
const runCommand = require("../lib/run-command");
const findCommand = require("../lib/find-command");

const toImagePath = str => path.basename(str.split(/"/)[1]);

const listArticleImagePaths = html => {
  const images = html.match(/\bsrc="\/img\/blog\/.*?"/g);

  if (!images) {
    return [];
  }

  return Promise.all(images.map(toImagePath));
};

const copyArticleImage = imagepath => fs.copyFile(
  path.join(config.src.articleImages, imagepath),
  path.join(config.dest.articleImages, imagepath)
);

const copyArticleImages = async html => {
  const imagePaths = await listArticleImagePaths(html);
  return Promise.all(imagePaths.map(copyArticleImage));
};

const hasSameLink = (link, article) => link === article.link;

const updateCache = (cache, html, name) => {
  const [title, ...body] = html.split("\n");
  const article = {
    body: `${body.join("\n").trim()}\n`,
    link: `/blog/${name}.html`,
    published: Date.now(),
    title: decodeHTMLEntities(title.replace(/<.*?>/g, ""))
  };
  const sameArticleIndex = cache.findIndex(hasSameLink.bind(
    null,
    article.link
  ));

  if (sameArticleIndex === -1) {
    return writeJSONFile(
      config.data.articles,
      [article, ...cache]
    );
  }

  return writeJSONFile(config.data.articles, [
    ...cache.slice(0, sameArticleIndex),
    {
      ...article,
      published: cache[sameArticleIndex].published
    },
    ...cache.slice(sameArticleIndex + 1)
  ]);
};

const getArticleTotal = cache => ` (${cache.length + 1})`;

const updateEntry = async file => {
  const cache = await readJSONFile(config.data.articles);
  const [git, node] = await Promise.all([
    findCommand("git"),
    findCommand("node"),
    copyArticleImages(file.content),
    updateCache(cache, file.content, file.name)
  ]);
  await Promise.all([
    runCommand(git, ["add", "--", config.data.articles]),
    runCommand(node, ["bin/html.js", `--article=${config.dest.articles}${file.name}.html`])
  ]);
  return runCommand(git, ["commit", `--message=${file.verb} ${file.name}${getArticleTotal(cache)}`]);
};

const isDraft = filename => {
  if (path.extname(filename) === ".html") {
    return true;
  }

  return false;
};

const getDraft = async filename => {
  const src = path.join(config.src.drafts, filename);
  return {
    content: await fs.readFile(src, "utf8"),
    name: path.basename(src, path.extname(src)),
    src: src
  };
};

const getDrafts = drafts => Promise.all(drafts.map(getDraft));

const listDrafts = async () => {
  const filenames = await fs.readdir(config.src.drafts);

  if (filenames.length < 1) {
    throw new Error("There is no draft.");
  }

  return getDrafts(filenames.filter(isDraft));
};

const selectDraft = drafts => new Promise(resolve => {
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
  const menu = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  menu.write("0. QUIT\n");
  drafts.forEach((n, i) => {
    const menuitem = n.content
      .trim()
      .split(/\n+/)[0]
      .replace(/^<h1>(.*?)<\/h1>$/, "$1");
    menu.write(`${i + 1}. ${menuitem}
`);
  });
  menu.question("Which one: (0) ", (a = 0) => {
    menu.close();
    const answer = Number.parseInt(a, 10);

    if (!Number.isInteger(answer) || answer > drafts.length) {
      throw new Error(`You must enter a number between 0 and ${drafts.length}.`);
    }

    if (answer === 0) {
      throw new Error("Aborted by user.");
    }

    return resolve(drafts[answer - 1]);
  });
});

const checkSelectedName = name => {
  if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]_?$/.test(name)) {
    throw new Error('This draft does not have a valid name. A draft filename must start and end with "a-z" or "0-9" and must not contain other than "-.a-z0-9".');
  }

  return true;
};

const checkSelectedContent = content => {
  if (!content.startsWith("<h1>")) {
    throw new Error("This draft does not have a title. A draft content must start with `<h1>`.");
  }

  return true;
};

const deleteFile = file => fs.unlink(file);

const contributeSelected = selected => Promise.all([
  deleteFile(selected.src),
  updateEntry(selected)
]);

const renderSelected = (template, selected, partials) => mustache
  .render(template, selected, partials)
  .replace(/(?<=\b(href|src)=")\/img\//g, "../src/img/")
  .replace(/(?<=\bhref=")\//g, "../dist/");

const testSelected = async selected => {
  const template = await fs.readFile(selected.src, "utf8");
  const [title, ...body] = selected.content.split("\n");
  const rendered = renderSelected(template, {
    ...selected,
    body: body.join("\n"),
    title: title
  });
  const [open] = await Promise.all([
    findCommand("open"),
    fs.writeFile(selected.dest, highlight(rendered))
  ]);
  return runCommand(open, [selected.dest]);
};

const main = async () => {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      c: "contribute",
      t: "test"
    },
    boolean: ["contribute", "test"]
  });
  const drafts = await listDrafts();
  const selected = await selectDraft(drafts);
  await Promise.all([
    checkSelectedName(selected.name),
    checkSelectedContent(selected.content)
  ]);

  if (argv.contribute) {
    return contributeSelected({
      ...selected,
      verb: "Contribute"
    });
  }

  return testSelected({
    ...selected,
    dest: config.dest.test,
    src: config.src.test
  });
};

main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
