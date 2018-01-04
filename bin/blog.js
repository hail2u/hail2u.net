const execFile = require("../lib/exec-file");
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const os = require("os");
const path = require("path");
const readline = require("readline");
const toPOSIXPath = require("../lib/to-posix-path");
const which = require("../lib/which");

const argv = minimist(process.argv.slice(2), {
  boolean: ["preview", "publish", "update"]
});
const blosxomDir = "../src/blosxom/";
const cacheFile = "../src/blog/articles.json";
const destDir = "../dist/blog/";
const destImgDir = "../dist/img/blog/";
const draftDir = path.resolve(os.homedir(), "Documents/Drafts/");
const srcDir = "../src/blosxom/entries/";
const srcImgDir = "../src/img/blog/";

const readFile = filepath => fs.readFile(filepath, "utf8");

const runCommand = async (command, args) => {
  let stdout;
  let stderr;

  try {
    ({ stdout, stderr } = await execFile(command, args));
  } catch (e) {
    console.error(stderr);
    throw e;
  }

  process.stdout.write(stdout);
};

const readCache = () => fs.readJSON(cacheFile, "utf8");

const hasSameLink = (link, article) => link === article.link;

const compareByUnixtime = (a, b) =>
  parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);

const writeCache = cache =>
  fs.outputJSON(cacheFile, cache, {
    spaces: 2
  });

const updateCache = async (html, name) => {
  const [title, ...body] = html.split("\n");
  const article = {
    body: body.join("\n").trim(),
    link: `/blog/${name}.html`,
    title: title.replace(/<.*?>/g, ""),
    unixtime: Date.now()
  };
  const cache = await readCache();
  const sameArticleIndex = cache.findIndex(
    hasSameLink.bind(null, article.link)
  );

  if (sameArticleIndex !== -1) {
    article.unixtime = cache[sameArticleIndex].unixtime;
    cache.splice(sameArticleIndex, 1);
  }

  return writeCache([article, ...cache].sort(compareByUnixtime));
};

const toImagePath = str => path.basename(str.split(/"/)[1]);

const listArticleImagePaths = html => {
  const images = html.match(/\bsrc="\/img\/blog\/.*?"/g);

  if (!images) {
    return [];
  }

  return images.map(toImagePath);
};

const copyArticleImage = async imagepath => {
  await fs.copy(
    path.join(srcImgDir, imagepath),
    path.join(destImgDir, imagepath)
  );
};

const copyArticleImages = async html => {
  const imagePaths = listArticleImagePaths(html);
  await Promise.all(imagePaths.map(copyArticleImage));
};

const buildArticle = async dest => {
  const perl = await which("perl");
  const { stdout } = await execFile(
    perl,
    [
      "blosxom.cgi",
      `path=/${toPOSIXPath(path.relative(destDir, dest))}`,
      "reindex=1"
    ],
    {
      cwd: blosxomDir,
      env: {
        BLOSXOM_CONFIG_DIR: path.resolve(blosxomDir)
      }
    }
  );
  return minifyHTML(
    stdout
      .replace(/^[\s\S]*?\r?\n\r?\n/, "")
      .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
      .trim()
  );
};

const updateEntry = async file => {
  const src = path.relative("", file.dest);
  const dest = path.join(
    destDir,
    path.relative(srcDir, path.dirname(src)),
    `${path.basename(src, ".txt")}.html`
  );
  const [git, htmlhint, npm] = await Promise.all([
    which("git"),
    which("htmlhint"),
    which("npm"),
    updateCache(file.contents, file.name),
    copyArticleImages(file.contents)
  ]);
  await runCommand(git, ["add", "--", src]);
  await runCommand(git, [
    "commit",
    `--message=${file.verb} ${toPOSIXPath(path.relative("../", src))}`
  ]);

  if (argv.update) {
    await runCommand(npm, [
      "run",
      "html",
      "--",
      `--article=${destDir}${file.name}.html`
    ]);
  }

  if (argv.publish) {
    const contents = await buildArticle(dest);
    await fs.outputFile(dest, contents);
  }

  await runCommand(htmlhint, ["--format", "compact", dest]);
};

const isDraft = filename => {
  if (
    [".html", ".markdown", ".md", ".txt"].indexOf(path.extname(filename)) !== -1
  ) {
    return true;
  }

  return false;
};

const getDraft = async filename => {
  const src = path.join(draftDir, filename);
  const ext = path.extname(src);
  return {
    contents: await readFile(src),
    ext: ext,
    name: path.basename(src, ext),
    src: src
  };
};

const listDrafts = async () => {
  const filenames = await fs.readdir(draftDir);
  return Promise.all(filenames.filter(isDraft).map(getDraft));
};

const selectDraft = drafts =>
  new Promise((resolve, reject) => {
    if (!argv.publish && drafts.length === 1) {
      return resolve(drafts[0]);
    }

    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    drafts.forEach((n, i) => {
      menu.write(`${i + 1}. ${n.contents
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
        return reject(
          new Error(`You must enter a number between 0 and ${drafts.length}.`)
        );
      }

      if (answer === 0) {
        return reject(new Error("Aborted by user."));
      }

      resolve(drafts[answer - 1]);
    });
  });

const checkSelectedName = name => {
  if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(name)) {
    throw new Error("This draft does not have a valid name for file.");
  }
};

const checkSelectedContents = contents => {
  if (!contents.startsWith("# ") && !contents.startsWith("<h1>")) {
    throw new Error("This draft does not have a title.");
  }
};

const markupSelected = (ext, contents) => {
  if (ext === ".html") {
    return contents;
  }

  return markdown(contents);
};

const deleteDraft = filepath => fs.unlink(filepath);

const publishSelected = selected =>
  Promise.all([
    fs.outputFile(selected.dest, selected.contents, {
      flags: "wx"
    }),
    deleteDraft(selected.src),
    updateEntry(selected)
  ]);

const renderSelected = (template, selected) =>
  mustache
    .render(template, selected)
    .replace(/="\/img\//g, '="../src/img/')
    .replace(/="\//g, '="../dist/');

const previewSelected = async selected => {
  const template = await readFile(selected.template);
  const rendered = renderSelected(template, selected);
  await fs.outputFile(selected.dest, rendered);
  const open = await which("open");
  await runCommand(open, [selected.dest]);
};

const main = async () => {
  if (argv.update) {
    const ext = path.extname(argv.file);
    const name = toPOSIXPath(
      path.join(
        path.relative(srcDir, path.dirname(argv.file)),
        path.basename(argv.file, ext)
      )
    );
    return updateEntry({
      contents: await readFile(argv.file),
      dest: path.resolve(argv.file),
      ext: ext,
      name: name,
      verb: "Update"
    });
  }

  const drafts = await listDrafts();
  const selected = await selectDraft(drafts);
  checkSelectedName(selected.name);
  checkSelectedContents(selected.contents);
  selected.contents = markupSelected(selected.ext, selected.contents);

  if (argv.publish) {
    selected.ext = ".txt";
    selected.dest = path.join(srcDir, `${selected.name}${selected.ext}`);
    selected.verb = "Add";
    return publishSelected(selected);
  }

  selected.dest = "../tmp/__preview.html";
  selected.template = "../src/preview.mustache";
  return previewSelected(selected);
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
