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

const blosxomDir = "../src/blosxom/";
const cacheFile = "../src/blog/articles.json";
const destDir = "../dist/blog/";
const destImgDir = "../dist/img/blog/";
const draftDir = path.resolve(os.homedir(), "./Documents/Drafts/");
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
  exec[name] = await which(name);
};
const readEntry = async file => {
  if (file.contents) {
    return file;
  }

  return {
    ...file,
    ...{
      contents: await fs.readFile(file.src, "utf8")
    }
  };
};
const addEntry = async file => {
  const { stdout } = await execFile(exec.git, ["add", "--", file.src]);

  process.stdout.write(stdout);

  return file;
};
const commitEntry = async file => {
  const { stdout } = await execFile(exec.git, [
    "commit",
    `--message=${file.verb} ${toPOSIXPath(path.relative("../", file.src))}`
  ]);

  process.stdout.write(stdout);

  return file;
};
const readCache = async () => fs.readJSON(cacheFile, "utf8");
const isDuplicate = (link, value) => value.link === link;
const addArticle = (article, articles) => {
  const oldArticle = articles.findIndex(isDuplicate.bind(null, article.link));

  if (oldArticle === -1) {
    return [article].concat(articles);
  }

  article.unixtime = articles[oldArticle].unixtime;
  articles[oldArticle] = article;

  return articles;
};
const saveCache = async articles =>
  fs.outputJSON(cacheFile, articles, {
    spaces: 2
  });
const updateCache = async file => {
  const [title, ...body] = file.contents.split("\n");
  let cache = await readCache();

  cache = addArticle(
    {
      body: body.join("\n").trim(),
      link: `/blog/${file.name}.html`,
      title: title.replace(/<.*?>/g, ""),
      unixtime: Date.now()
    },
    cache
  );
  await saveCache(cache);

  return file;
};
const listArticleImages = async file => {
  const data = await fs.readFile(file.src, "utf8");

  return {
    ...file,
    ...{
      images: data.match(/\bsrc="\/img\/blog\/.*?"/g)
    }
  };
};
const copyArticleImage = async image => {
  image = path.basename(image.split(/"/)[1]);
  fs.copy(path.join(srcImgDir, image), path.join(destImgDir, image));
};
const copyArticleImages = async file => {
  if (file.images) {
    await Promise.all(file.images.map(copyArticleImage));
  }

  return file;
};
const argv = minimist(process.argv.slice(2), {
  boolean: ["preview", "publish", "update"]
});
const runDocsArticle = async file => {
  if (argv.publish) {
    return file;
  }

  const { stdout } = await execFile(exec.npm, [
    "run",
    "html",
    "--",
    `--article=${destDir}${file.name}.html`
  ]);

  process.stdout.write(stdout);

  return file;
};
const buildArticle = async file => {
  if (argv.update) {
    return file;
  }

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

  return {
    ...file,
    ...{
      contents: minifyHTML(
        stdout
          .replace(/^[\s\S]*?\r?\n\r?\n/, "")
          .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
          .trim()
      )
    }
  };
};
const saveFile = async file => {
  if (argv.update) {
    return file;
  }

  await fs.outputFile(file.dest, file.contents, {
    flags: "wx"
  });

  return file;
};
const testArticle = async file => {
  const { stdout } = await execFile(exec.htmlhint, [
    "--format",
    "compact",
    file.dest
  ]);

  process.stdout.write(stdout);

  return file;
};
const runDocs = async file => {
  const { stdout } = await execFile(exec.npm, ["run", "html"]);

  process.stdout.write(stdout);

  return file;
};
const updateEntry = async file => {
  file.src = path.relative("", file.dest);
  file.dest = path.join(
    destDir,
    path.relative(srcDir, path.dirname(file.src)),
    `${path.basename(file.src, ".txt")}.html`
  );

  if (!file.name) {
    file.name = toPOSIXPath(
      path.join(
        path.relative(srcDir, path.dirname(file.src)),
        path.basename(file.src, ".txt")
      )
    );
  }

  file = await readEntry(file);
  file = await addEntry(file);
  file = await commitEntry(file);
  file = await updateCache(file);
  file = await listArticleImages(file);
  file = await copyArticleImages(file);
  file = await runDocsArticle(file);
  file = await buildArticle(file);
  file = await saveFile(file);
  file = await testArticle(file);
  runDocs(file);
};
const isDraft = file => {
  if (
    [".html", ".markdown", ".md", ".txt"].indexOf(path.extname(file)) !== -1
  ) {
    return true;
  }

  return false;
};
const listDrafts = async () => {
  const files = await fs.readdir(draftDir);

  return files.filter(isDraft);
};
const getDraft = async file => {
  file = path.join(draftDir, file);

  return {
    ...file,
    ...{
      contents: await fs.readFile(file, "utf8"),
      ext: path.extname(file),
      name: path.basename(file, path.extname(file)),
      src: file
    }
  };
};
const getDrafts = files => Promise.all(files.map(getDraft));
const selectDraft = files =>
  new Promise((resolve, reject) => {
    if (!argv.publish && files.length === 1) {
      return resolve(files[0]);
    }

    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    files.forEach((n, i) => {
      menu.write(`${i + 1}. ${n.contents
        .trim()
        .split(/\n+/)[0]
        .replace(/^# /, "")
        .replace(/^<h1>(.*?)<\/h1>$/, "$1")}
`);
    });
    menu.write("0. QUIT\n");
    menu.question("Which one: (0) ", a => {
      menu.close();

      if (!a) {
        a = 0;
      }

      a = parseInt(a, 10);

      if (!Number.isInteger(a) || a > files.length) {
        return reject(
          new Error(`You must enter a number between 0 and ${files.length}.`)
        );
      }

      if (a === 0) {
        return reject(new Error("Aborted by user."));
      }

      resolve(files[a - 1]);
    });
  });
const checkSelected = file => {
  if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(file.name)) {
    throw new Error("This draft does not have a valid name for file.");
  }

  if (!file.contents.startsWith("# ") && !file.contents.startsWith("<h1>")) {
    throw new Error("This draft does not have a title.");
  }

  return file;
};
const markupSelected = file => {
  if (file.ext !== ".html") {
    file.contents = markdown(file.contents);
  }

  return file;
};
const deleteDraft = async file => {
  await fs.unlink(file.src);

  return file;
};
const publishSelected = async file => {
  file = await saveFile(file);
  file = await deleteDraft(file);
  updateEntry(file);
};
const readTemplate = async file => ({
  ...file,
  ...{
    template: await fs.readFile(file.template, "utf8")
  }
});
const buildPreview = file => ({
  ...file,
  ...{
    contents: mustache
      .render(file.template, file)
      .replace(/="\/img\//g, '="../src/img/')
      .replace(/="\//g, '="../dist/')
  }
});
const openPreview = async file => execFile(exec.open, [file.dest]);
const previewSelected = async file => {
  file = await readTemplate(file);
  file = await buildPreview(file);
  file = await saveFile(file);
  openPreview(file);
};
const processSelected = file => {
  if (argv.publish) {
    file.dest = path.join(srcDir, `${file.name}.txt`);
    file.verb = "Add";

    return publishSelected(file);
  }

  return previewSelected({
    ...file,
    ...{
      dest: "../tmp/__preview.html",
      template: "../src/preview.mustache"
    }
  });
};
const main = async () => {
  await Promise.all(Object.keys(exec).map(findExec));

  if (argv.update) {
    return updateEntry({
      dest: path.resolve(argv.file),
      verb: "Update"
    });
  }

  let files = await listDrafts();

  files = await getDrafts(files);

  let file = await selectDraft(files);

  file = await checkSelected(file);
  file = await markupSelected(file);
  processSelected(file);
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
