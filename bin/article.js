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

const getDraft = async filename => {
  const src = path.join(config.src.drafts, filename);
  const content = await fs.readFile(src, "utf8");
  const [title, ...rest] = content.split("\n");
  const body = rest.join("\n")
    .replace(/(?<=\b(href|src)=")\.\.(\/\.\.\/dist)?\//g, "/")
    .trim();
  return {
    body: `${body}\n`,
    name: path.basename(src, path.extname(src)),
    src: src,
    title: decodeHTMLEntities(title.replace(/<.*?>/g, ""))
  };
};

const getDrafts = drafts => Promise.all(drafts.map(getDraft));

const isDraft = filename => {
  if (path.extname(filename) === ".html") {
    return true;
  }

  return false;
};

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
    menu.write(`${i + 1}. ${n.title}
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

const checkSelectedTitle = title => {
  if (typeof title !== "string" || title.length < 8) {
    throw new Error("This draft does not have a valid title. A draft title must be a long enough string.");
  }

  return true;
};

const deleteFile = file => fs.unlink(file);

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

const updateCache = (cache, file) => {
  const article = {
    body: file.body,
    link: `/blog/${file.name}.html`,
    published: Date.now(),
    title: file.title
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
    copyArticleImages(file.body),
    updateCache(cache, file)
  ]);
  await Promise.all([
    runCommand(git, ["add", "--", config.data.articles]),
    runCommand(node, ["bin/html.js", `--article=${config.dest.articles}${file.name}.html`])
  ]);
  return runCommand(git, ["commit", `--message=${file.verb} ${file.name}${getArticleTotal(cache)}`]);
};

const contributeSelected = selected => Promise.all([
  deleteFile(selected.src),
  updateEntry(selected)
]);

const testSelected = async selected => {
  const template = await fs.readFile(selected.src, "utf8");
  const rendered = mustache
    .render(template, selected)
    .replace(/(?<=\b(href|src)=")\/img\//g, "../src/img/")
    .replace(/(?<=\bhref=")\//g, "../dist/");
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
    checkSelectedTitle(selected.title)
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
