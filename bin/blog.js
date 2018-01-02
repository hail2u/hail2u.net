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
const exec = {
  git: "git",
  htmlhint: "htmlhint",
  npm: "npm",
  open: "open",
  perl: "perl"
};
const srcDir = "../src/blosxom/entries/";
const srcImgDir = "../src/img/blog/";

const findExec = async name => {
  exec[name] = await which(exec[name]);
};

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

const isDuplicateArticle = (link, article) => article.link === link;

const addArticle = (article, articles) => {
  const oldArticle = articles.findIndex(
    isDuplicateArticle.bind(null, article.link)
  );

  if (oldArticle === -1) {
    return [article].concat(articles);
  }

  article.unixtime = articles[oldArticle].unixtime;
  articles[oldArticle] = article;
  return articles;
};

const updateCache = async file => {
  const [title, ...body] = file.contents.split("\n");
  const cache = addArticle(
    {
      body: body.join("\n").trim(),
      link: `/blog/${file.name}.html`,
      title: title.replace(/<.*?>/g, ""),
      unixtime: Date.now()
    },
    await fs.readJSON(cacheFile, "utf8")
  );
  await fs.outputJSON(cacheFile, cache, {
    spaces: 2
  });
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

const buildArticle = async file => {
  const { stdout } = await execFile(
    exec.perl,
    [
      "blosxom.cgi",
      `path=/${toPOSIXPath(path.relative(destDir, file.dest))}`,
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

const saveFile = (filepath, data) =>
  fs.outputFile(filepath, data, {
    flags: "wx"
  });

const updateEntry = async file => {
  const entry = file;
  entry.src = path.relative("", entry.dest);
  entry.dest = path.join(
    destDir,
    path.relative(srcDir, path.dirname(entry.src)),
    `${path.basename(entry.src, ".txt")}.html`
  );

  if (!entry.name) {
    entry.name = toPOSIXPath(
      path.join(
        path.relative(srcDir, path.dirname(entry.src)),
        path.basename(entry.src, ".txt")
      )
    );
  }

  if (!entry.contents) {
    entry.contents = await readFile(entry.src);
  }

  await runCommand(exec.git, ["add", "--", entry.src]);
  await runCommand(exec.git, [
    "commit",
    `--message=${entry.verb} ${toPOSIXPath(path.relative("../", entry.src))}`
  ]);
  await updateCache(entry);
  await copyArticleImages(entry.contents);

  if (argv.update) {
    await runCommand(exec.npm, [
      "run",
      "html",
      "--",
      `--article=${destDir}${entry.name}.html`
    ]);
  }

  if (argv.publish) {
    entry.contents = await buildArticle(entry);
    await saveFile(entry.dest, entry.contents);
  }

  await runCommand(exec.htmlhint, ["--format", "compact", entry.dest]);
  await runCommand(exec.npm, ["run", "html"]);
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
  let filenames = await fs.readdir(draftDir);
  filenames = filenames.filter(isDraft);
  return Promise.all(filenames.map(getDraft));
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

const checkSelected = selected => {
  if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(selected.name)) {
    throw new Error("This draft does not have a valid name for file.");
  }

  if (
    !selected.contents.startsWith("# ") &&
    !selected.contents.startsWith("<h1>")
  ) {
    throw new Error("This draft does not have a title.");
  }
};

const markupSelected = selected => {
  if (selected.ext === ".html") {
    return selected.contents;
  }

  return markdown(selected.contents);
};

const deleteDraft = filepath => fs.unlink(filepath);

const publishSelected = async selected => {
  await saveFile(selected.dest, selected.contents);
  await deleteDraft(selected.src);
  await updateEntry(selected);
};

const renderSelected = selected =>
  mustache
    .render(selected.template, selected)
    .replace(/="\/img\//g, '="../src/img/')
    .replace(/="\//g, '="../dist/');

const previewSelected = async selected => {
  selected.template = await readFile(selected.template);
  selected.contents = renderSelected(selected);
  await saveFile(selected.dest, selected.contents);
  await runCommand(exec.open, [selected.dest]);
};

const main = async () => {
  await Promise.all(Object.keys(exec).map(findExec));

  if (argv.update) {
    return updateEntry({
      dest: path.resolve(argv.file),
      verb: "Update"
    });
  }

  const drafts = await listDrafts();
  const selected = await selectDraft(drafts);
  checkSelected(selected);
  selected.contents = markupSelected(selected);

  if (argv.publish) {
    selected.dest = path.join(srcDir, `${selected.name}.txt`);
    selected.verb = "Add";
    return publishSelected(selected);
  }

  return previewSelected({
    ...selected,
    ...{
      dest: "../tmp/__preview.html",
      template: "../src/preview.mustache"
    }
  });
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
