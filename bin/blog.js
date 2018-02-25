const { execFile } = require("child_process");
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const mustache = require("mustache");
const os = require("os");
const path = require("path");
const readline = require("readline");
const toPOSIXPath = require("../lib/to-posix-path");
const util = require("util");
const which = require("which");

const argv = minimist(process.argv.slice(2), {
  boolean: ["preview", "contribute", "update"]
});
const blosxomDir = "../src/blosxom/";
const cacheFile = "../src/blog/articles.json";
const destDir = "../dist/blog/";
const destImgDir = "../dist/img/blog/";
const draftDir = path.resolve(os.homedir(), "Documents/Drafts/");
const draftExts = [".html", ".markdown", ".md", ".txt"];
const execFileAsync = util.promisify(execFile);
const srcDir = "../src/blosxom/entries/";
const srcImgDir = "../src/img/blog/";
const whichAsync = util.promisify(which);

const runCommand = async (command, args) => {
  const { stdout } = await execFileAsync(command, args);
  process.stdout.write(stdout);
};

const getArticleNum = async () => {
  if (argv.update) {
    return "";
  }
  // Don’t read cache here
  const cache = await fs.readJSON(cacheFile, "utf8");
  return ` (${cache.length + 1})`;
};

const commitEntry = async (file, verb) => {
  const git = await whichAsync("git");
  await runCommand(git, ["add", "--", file]);
  await runCommand(git, [
    "commit",
    `--message=${verb} ${toPOSIXPath(
      path.relative("../", file)
    )}${await getArticleNum()}`
  ]);
};

const hasSameLink = (link, article) => link === article.link;

const compareByUnixtime = (a, b) =>
  parseInt(b.unixtime, 10) - parseInt(a.unixtime, 10);

const saveCache = cache =>
  fs.outputJSON(cacheFile, cache.sort(compareByUnixtime), {
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
  const cache = await fs.readJSON(cacheFile, "utf8");
  const sameArticleIndex = cache.findIndex(
    hasSameLink.bind(null, article.link)
  );

  if (sameArticleIndex === -1) {
    return saveCache([article, ...cache]);
  }

  return saveCache([
    {
      ...article,
      unixtime: cache[sameArticleIndex].unixtime
    },
    ...cache.slice(0, sameArticleIndex),
    ...cache.slice(sameArticleIndex + 1)
  ]);
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

const buildArticle = async dest => {
  const perl = await whichAsync("perl");
  const { stdout } = await execFileAsync(
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
  return stdout
    .replace(/^[\s\S]*?\r?\n\r?\n/, "")
    .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
    .trim();
};

const updateEntry = async file => {
  const src = path.relative("", file.dest);
  const dest = path.join(
    destDir,
    path.relative(srcDir, path.dirname(src)),
    `${path.basename(src, ".txt")}.html`
  );
  const [npm] = await Promise.all([
    whichAsync("npm"),
    commitEntry(src, file.verb),
    updateCache(file.contents, file.name),
    copyArticleImages(file.contents)
  ]);

  if (argv.update) {
    await runCommand(npm, [
      "run",
      "html",
      "--",
      `--article=${destDir}${file.name}.html`
    ]);
  }

  if (argv.contribute) {
    const html = await buildArticle(dest);
    await fs.outputFile(dest, html);
  }
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
    contents: await fs.readFile(src, "utf8"),
    ext: ext,
    name: path.basename(src, ext),
    src: src
  };
};

const getDrafts = drafts => Promise.all(drafts.map(getDraft));

const listDrafts = async () => {
  const filenames = await fs.readdir(draftDir);
  return getDrafts(filenames.filter(isDraft));
};

const selectDraft = drafts =>
  new Promise((resolve, reject) => {
    if (!argv.contribute && drafts.length === 1) {
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

const contributeSelected = selected =>
  Promise.all([
    fs.outputFile(selected.dest, selected.contents, {
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

const previewSelected = async selected => {
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
      contents: await fs.readFile(argv.file, "utf8"),
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
  checkSelectedName(selected.name);
  checkSelectedContents(selected.contents);
  const html = markupSelected(selected.ext, selected.contents);

  if (argv.contribute) {
    const ext = ".txt";
    return contributeSelected({
      ...selected,
      contents: html,
      ext: ext,
      dest: path.join(srcDir, `${selected.name}${ext}`),
      verb: "Add"
    });
  }

  return previewSelected({
    ...selected,
    contents: html,
    dest: "../tmp/__preview.html",
    template: "../src/preview.mustache"
  });
};

process.chdir(__dirname);
main().catch(e => {
  process.exitCode = 1;
  console.trace(e);
});
