const { execFile } = require("child_process");
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const mustache = require("mustache");
const os = require("os");
const path = require("path");
const readline = require("readline");
const toPOSIXPath = require("../lib/to-posix-path");
const { promisify } = require("util");
const which = require("which");

const argv = minimist(process.argv.slice(2), {
  boolean: ["contribute", "test", "update"],
  string: ["file"]
});
const cacheFile = "../src/blog/articles.json";
const destDir = "../dist/blog/";
const destImgDir = "../dist/img/blog/";
const draftDir = path.resolve(os.homedir(), "Documents/Drafts/");
const draftExts = [".html", ".markdown", ".md", ".txt"];
const draftNameRe = /^[a-z0-9][-.a-z0-9]*[a-z0-9]$/;
const execFileAsync = promisify(execFile);
const srcDir = "../src/blog/";
const srcImgDir = "../src/img/blog/";
const whichAsync = promisify(which);

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  process.stdout.write(stdout);
};

const toImagePath = str => path.basename(str.split(/"/)[1]);

const listArticleImagePaths = html => {
  const images = html.match(/\bsrc="\/img\/blog\/.*?"/g);

  if (!images) {
    return [];
  }

  return Promise.all(images.map(toImagePath));
};

const copyArticleImage = async imagepath => {
  await fs.copy(
    path.join(srcImgDir, imagepath),
    path.join(destImgDir, imagepath)
  );
};

const copyArticleImages = async html => {
  const imagePaths = await listArticleImagePaths(html);
  await Promise.all(imagePaths.map(copyArticleImage));
};

const hasSameLink = (link, article) => link === article.link;

const compareByUnixtime = (a, b) =>
  parseInt(b.published, 10) - parseInt(a.published, 10);

const saveCache = cache =>
  fs.outputJSON(cacheFile, cache.sort(compareByUnixtime), {
    spaces: 2
  });

const updateCache = (cache, html, name) => {
  const [title, ...body] = html.split("\n");
  const article = {
    body: body.join("\n").trim(),
    link: `/blog/${name}.html`,
    title: title.replace(/<.*?>/g, ""),
    published: Date.now()
  };
  const sameArticleIndex = cache.findIndex(
    hasSameLink.bind(null, article.link)
  );

  if (sameArticleIndex === -1) {
    return saveCache([article, ...cache]);
  }

  return saveCache([
    {
      ...article,
      published: cache[sameArticleIndex].published
    },
    ...cache.slice(0, sameArticleIndex),
    ...cache.slice(sameArticleIndex + 1)
  ]);
};

const addFiles = (git, ...files) => runCommand(git, ["add", "--", ...files]);

const buildArticle = (npm, name) =>
  runCommand(npm, ["run", "html", "--", `--article=${destDir}${name}.html`]);

const commitFiles = (git, verb, file, num) =>
  runCommand(git, ["commit", `--message=${verb} ${file}${num}`]);

const getArticleTotal = cache => {
  if (argv.update) {
    return "";
  }

  return ` (${cache.length + 1})`;
};

const updateEntry = async file => {
  const [cache, git] = await Promise.all([
    fs.readJSON(cacheFile, "utf8"),
    whichAsync("git"),
    copyArticleImages(file.content)
  ]);
  const src = path.relative("", file.dest);
  const [npm] = await Promise.all([
    whichAsync("npm"),
    updateCache(cache, file.content, file.name)
  ]);
  await Promise.all([
    addFiles(git, src, path.relative("", cacheFile)),
    buildArticle(npm, file.name)
  ]);
  await commitFiles(
    git,
    file.verb,
    toPOSIXPath(path.relative("../", src)),
    getArticleTotal(cache)
  );
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

const selectDraft = drafts =>
  new Promise(resolve => {
    if (!argv.contribute && drafts.length === 1) {
      return resolve(drafts[0]);
    }

    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    drafts.forEach((n, i) => {
      menu.write(`${i + 1}. ${n.content
        .trim()
        .split(/\n+/)[0]
        .replace(/^# /, "")
        .replace(/^<h1>(.*?)<\/h1>$/, "$1")}
`);
    });
    menu.write("0. QUIT\n");
    menu.question("Which one: (0) ", (a = 0) => {
      menu.close();
      const answer = parseInt(a, 10);

      if (!Number.isInteger(answer) || answer > drafts.length) {
        throw new Error(
          `You must enter a number between 0 and ${drafts.length}.`
        );
      }

      if (answer === 0) {
        throw new Error("Aborted by user.");
      }

      resolve(drafts[answer - 1]);
    });
  });

const checkSelectedName = name => {
  if (!draftNameRe.test(name)) {
    throw new Error(
      'This draft does not have a valid name. A draft filename must start and end with "a-z" or "0-9" and must not contain other than "-.a-z0-9".'
    );
  }
};

const checkSelectedContent = content => {
  if (!content.startsWith("# ") && !content.startsWith("<h1>")) {
    throw new Error(
      "This draft does not have a title. A draft content must start with `# ` or `<h1>`."
    );
  }
};

const markupSelected = (ext, content) => {
  if (ext === ".html") {
    return content;
  }

  return markdown(content);
};

const contributeSelected = selected =>
  Promise.all([
    fs.outputFile(selected.dest, selected.content, {
      flag: "wx"
    }),
    fs.unlink(selected.src),
    updateEntry(selected)
  ]);

const renderSelected = (template, selected) =>
  mustache
    .render(template, selected)
    .replace(/="\/img\//g, '="../src/img/')
    .replace(/="\//g, '="../dist/');

const testSelected = async selected => {
  const template = await fs.readFile(selected.template, "utf8");
  const rendered = renderSelected(template, selected);
  await fs.outputFile(selected.dest, rendered);
  const open = await whichAsync("open");
  await runCommand(open, [selected.dest]);
};

const main = async () => {
  if (argv.update) {
    const ext = path.extname(argv.file);
    return updateEntry({
      content: await fs.readFile(argv.file, "utf8"),
      dest: path.resolve(argv.file),
      ext: ext,
      name: toPOSIXPath(
        path.join(
          path.relative(srcDir, path.dirname(argv.file)),
          path.basename(argv.file, ext)
        )
      ),
      verb: "Update"
    });
  }

  const drafts = await listDrafts();
  const selected = await selectDraft(drafts);
  await Promise.all([
    checkSelectedName(selected.name),
    checkSelectedContent(selected.content)
  ]);
  const html = markupSelected(selected.ext, selected.content);

  if (argv.contribute) {
    const ext = ".html";
    return contributeSelected({
      ...selected,
      content: html,
      dest: path.join(srcDir, `${selected.name}${ext}`),
      ext: ext,
      verb: "Add"
    });
  }

  return testSelected({
    ...selected,
    content: html,
    dest: "../tmp/__test.html",
    template: "../src/blog/test.mustache"
  });
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
