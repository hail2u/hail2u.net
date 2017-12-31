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
  exec[name] = await which(exec[name]);
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
const saveCache = articles =>
  fs.outputJSON(cacheFile, articles, {
    spaces: 2
  });
const updateCache = async file => {
  const [title, ...body] = file.contents.split("\n");
  const cache = addArticle(
    {
      body: body.join("\n").trim(),
      link: `/blog/${file.name}.html`,
      title: title.replace(/<.*?>/g, ""),
      unixtime: Date.now()
    },
    await readCache()
  );

  await saveCache(cache);
};
const listArticleImages = async file => {
  const content = await fs.readFile(file.src, "utf8");

  return {
    ...file,
    ...{
      images: content.match(/\bsrc="\/img\/blog\/.*?"/g)
    }
  };
};
const copyArticleImage = image => {
  image = path.basename(image.split(/"/)[1]);
  fs.copy(path.join(srcImgDir, image), path.join(destImgDir, image));
};
const argv = minimist(process.argv.slice(2), {
  boolean: ["preview", "publish", "update"]
});
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
const saveFile = file =>
  fs.outputFile(file.dest, file.contents, {
    flags: "wx"
  });
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
  await runCommand(exec.git, ["add", "--", file.src]);
  await runCommand(exec.git, [
    "commit",
    `--message=${file.verb} ${toPOSIXPath(path.relative("../", file.src))}`
  ]);
  await updateCache(file);
  file = await listArticleImages(file);

  if (file.images) {
    await Promise.all(file.images.map(copyArticleImage));
  }

  if (argv.update) {
    await runCommand(exec.npm, [
      "run",
      "html",
      "--",
      `--article=${destDir}${file.name}.html`
    ]);
  }

  file = await buildArticle(file);
  await saveFile(file);
  await runCommand(exec.htmlhint, ["--format", "compact", file.dest]);
  runCommand(exec.npm, ["run", "html"]);
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
    contents: await fs.readFile(file, "utf8"),
    ext: path.extname(file),
    name: path.basename(file, path.extname(file)),
    src: file
  };
};
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
};
const markupSelected = file => {
  if (file.ext === ".html") {
    return file;
  }

  return {
    ...file,
    ...{
      contents: markdown(file.contents)
    }
  };
};
const deleteDraft = file => fs.unlink(file.src);
const publishSelected = async file => {
  await saveFile(file);
  await deleteDraft(file);
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
const previewSelected = async file => {
  file = await readTemplate(file);
  file = await buildPreview(file);
  await saveFile(file);
  runCommand(exec.open, [file.dest]);
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

  files = await Promise.all(files.map(getDraft));

  let file = await selectDraft(files);

  await checkSelected(file);
  file = await markupSelected(file);
  processSelected(file);
};

process.chdir(__dirname);
main().catch(e => {
  console.trace(e);
});
