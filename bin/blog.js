const { decode } = require("../lib/html-entities");
const fs = require("fs").promises;
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const mustache = require("mustache");
const path = require("path");
const { readJSONFile, writeJSONFile } = require("../lib/json");
const readline = require("readline");
const runCommand = require("../lib/run-command");
const toPOSIXPath = require("../lib/to-posix-path");
const whichAsync = require("../lib/which-async");

const argv = minimist(process.argv.slice(2), {
  alias: {
    c: "contribute",
    f: "file",
    t: "test",
    u: "update"
  },
  boolean: ["contribute", "test", "update"],
  default: {
    file: ""
  },
  string: ["file"]
});
const cacheFile = "../src/blog/articles.json";
const destDir = "../dist/blog/";
const destImgDir = "../dist/img/blog/";
const draftDir = "../src/drafts/";
const draftExts = [".html", ".markdown", ".md"];
const draftNameRe = /^[a-z0-9][-.a-z0-9]*[a-z0-9]_?$/;
const srcDir = "../src/blog/";
const srcImgDir = "../src/img/blog/";

const toImagePath = str => path.basename(str.split(/"/)[1]);

const listArticleImagePaths = html => {
  const images = html.match(/\bsrc="\/img\/blog\/.*?"/g);

  if (!images) {
    return [];
  }

  return Promise.all(images.map(toImagePath));
};

const copyArticleImage = imagepath => fs.copyFile(
  path.join(srcImgDir, imagepath),
  path.join(destImgDir, imagepath)
);

const copyArticleImages = async html => {
  const imagePaths = await listArticleImagePaths(html);
  return Promise.all(imagePaths.map(copyArticleImage));
};

const hasSameLink = (link, article) => link === article.link;

const compareByUnixtime = (a, b) =>
  Number.parseInt(b.published, 10) - Number.parseInt(a.published, 10);

const updateCache = (cache, html, name) => {
  const [title, ...body] = html.split("\n");
  const article = {
    body: `${body.join("\n").trim()}\n`,
    link: `/blog/${name}.html`,
    published: Date.now(),
    title: decode(title.replace(/<.*?>/g, ""))
  };
  const sameArticleIndex = cache.findIndex(hasSameLink.bind(
    null,
    article.link
  ));

  if (sameArticleIndex === -1) {
    return writeJSONFile(
      cacheFile,
      [article, ...cache].sort(compareByUnixtime)
    );
  }

  return writeJSONFile(cacheFile, [
    {
      ...article,
      published: cache[sameArticleIndex].published
    },
    ...cache.slice(0, sameArticleIndex),
    ...cache.slice(sameArticleIndex + 1)
  ].sort(compareByUnixtime));
};

const getArticleTotal = cache => {
  if (argv.update) {
    return "";
  }

  return ` (${cache.length + 1})`;
};

const updateEntry = async file => {
  const [cache, git] = await Promise.all([
    readJSONFile(cacheFile),
    whichAsync("git"),
    copyArticleImages(file.content)
  ]);
  const src = path.relative("", file.dest);
  const [npm] = await Promise.all([
    whichAsync("npm"),
    updateCache(cache, file.content, file.name)
  ]);
  await Promise.all([
    runCommand(git, ["add", "--", src, path.relative("", cacheFile)]),
    runCommand(npm, ["run", "html", "--", `--article=${destDir}${file.name}.html`])
  ]);
  return runCommand(git, ["commit", `--message=${file.verb} ${toPOSIXPath(path.relative("../", src))}${getArticleTotal(cache)}`]);
};

const isDraft = filename => {
  const ext = path.extname(filename);

  if (argv.contribute && path.basename(filename, ext).endsWith("_")) {
    return false;
  }

  if (draftExts.indexOf(ext) !== -1) {
    return true;
  }

  return false;
};

const getDraft = async filename => {
  const src = path.join(draftDir, filename);
  const ext = path.extname(src);
  return {
    content: await fs.readFile(src, "utf8"),
    ext: ext,
    name: path.basename(src, ext),
    src: src
  };
};

const getDrafts = drafts => Promise.all(drafts.map(getDraft));

const listDrafts = async () => {
  const filenames = await fs.readdir(draftDir);

  if (filenames.length < 1) {
    throw new Error("There is no draft.");
  }

  return getDrafts(filenames.filter(isDraft));
};

const selectDraft = drafts => new Promise(resolve => {
  if (!argv.contribute && drafts.length === 1) {
    return resolve(drafts[0]);
  }

  const menu = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  menu.write("0. QUIT\n");
  drafts.forEach((n, i) => {
    const menuitem = n.content
      .trim()
      .split(/\n+/)[0]
      .replace(/^# /, "")
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
  if (!draftNameRe.test(name)) {
    throw new Error('This draft does not have a valid name. A draft filename must start and end with "a-z" or "0-9" and must not contain other than "-.a-z0-9".');
  }

  return true;
};

const checkSelectedContent = content => {
  if (!content.startsWith("# ") && !content.startsWith("<h1>")) {
    throw new Error("This draft does not have a title. A draft content must start with `# ` or `<h1>`.");
  }

  return true;
};

const deleteFile = file => fs.unlink(file);

const markupSelected = async (ext, content) => {
  if (ext === ".html") {
    return content;
  }

  const [html, included] = markdown(content);

  if (argv.contribute && included.length > 0) {
    await Promise.all(included.map(deleteFile));
  }

  return html;
};

const contributeSelected = selected => Promise.all([
  fs.writeFile(selected.dest, selected.content, {
    flag: "wx"
  }),
  deleteFile(selected.src),
  updateEntry(selected)
]);

const renderSelected = (template, selected, partials) => mustache
  .render(template, selected, partials)
  .replace(/="\/img\//g, '="../src/img/')
  .replace(/="\//g, '="../dist/');

const testSelected = async selected => {
  const template = await fs.readFile(selected.template, "utf8");
  const partials = {
    css: await fs.readFile(selected.css, "utf8")
  };
  const rendered = renderSelected(template, selected, partials);
  const [open] = await Promise.all([
    whichAsync("open"),
    fs.writeFile(selected.dest, rendered)
  ]);
  return runCommand(open, [selected.dest]);
};

const main = async () => {
  if (argv.update) {
    const ext = path.extname(argv.file);
    return updateEntry({
      content: await fs.readFile(argv.file, "utf8"),
      dest: path.resolve(argv.file),
      ext: ext,
      name: toPOSIXPath(path.join(
        path.relative(srcDir, path.dirname(argv.file)),
        path.basename(argv.file, ext)
      )),
      verb: "Update"
    });
  }

  const drafts = await listDrafts();
  const selected = await selectDraft(drafts);
  await Promise.all([
    checkSelectedName(selected.name),
    checkSelectedContent(selected.content)
  ]);
  const html = await markupSelected(selected.ext, selected.content);

  if (argv.contribute) {
    const ext = ".html";
    return contributeSelected({
      ...selected,
      content: `${html.trim()}\n`,
      dest: path.join(srcDir, `${selected.name}${ext}`),
      ext: ext,
      verb: "Contribute"
    });
  }

  return testSelected({
    ...selected,
    content: html,
    css: "../src/partial/css.mustache",
    dest: "../tmp/__test.html",
    template: "../src/blog/test.mustache"
  });
};

argv.file = path.resolve(argv.file);
process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
