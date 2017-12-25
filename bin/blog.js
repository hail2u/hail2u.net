const { execFile } = require("child_process");
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minifyHTML = require("../lib/html-minifier");
const minimist = require("minimist");
const mustache = require("mustache");
const os = require("os");
const path = require("path");
const readline = require("readline");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");
const which = require("which");

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

const findExec = name =>
  new Promise((resolve, reject) => {
    which(name, (e, p) => {
      if (e) {
        return reject(e);
      }

      exec[name] = p;
      resolve();
    });
  });
const readEntry = file =>
  new Promise((resolve, reject) => {
    if (file.contents) {
      return resolve(file);
    }

    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.contents = d;
      resolve(file);
    });
  });
const addEntry = file =>
  new Promise((resolve, reject) => {
    execFile(exec.git, ["add", "--", file.src], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
const commitEntry = file =>
  new Promise((resolve, reject) => {
    execFile(
      exec.git,
      [
        "commit",
        `--message=Add ${toPOSIXPath(path.relative("../", file.src))}`
      ],
      (e, o) => {
        if (e) {
          return reject(e);
        }

        process.stdout.write(o);
        resolve(file);
      }
    );
  });
const readCache = () =>
  new Promise((resolve, reject) => {
    fs.readJSON(cacheFile, "utf8", (e, o) => {
      if (e) {
        return reject(e);
      }

      resolve(o);
    });
  });
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
  new Promise((resolve, reject) => {
    fs.outputJSON(
      cacheFile,
      articles,
      {
        spaces: 2
      },
      e => {
        if (e) {
          return reject(e);
        }

        resolve();
      }
    );
  });
const updateCache = file => {
  const [title, ...body] = file.contents.split("\n");

  return waterfall([
    readCache,
    addArticle.bind(null, {
      body: body.join("\n").trim(),
      link: `/blog/${file.name}.html`,
      title: title.replace(/<.*?>/g, ""),
      unixtime: Date.now()
    }),
    saveCache
  ]).then(() => file);
};
const listArticleImages = file =>
  new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.images = d.match(/\bsrc="\/img\/blog\/.*?"/g);
      resolve(file);
    });
  });
const copyArticleImage = image =>
  new Promise((resolve, reject) => {
    image = path.basename(image.split(/"/)[1]);
    fs.copy(path.join(srcImgDir, image), path.join(destImgDir, image), e => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
const copyArticleImages = file => {
  if (!file.images) {
    return file;
  }

  return Promise.all(file.images.map(copyArticleImage)).then(() => file);
};
const argv = minimist(process.argv.slice(2), {
  boolean: ["preview", "publish", "update"]
});
const runDocsArticle = file =>
  new Promise((resolve, reject) => {
    if (argv.publish) {
      return resolve(file);
    }

    execFile(
      exec.npm,
      ["run", "docs", "--", `--article=${destDir}${file.name}.html`],
      (e, o) => {
        if (e) {
          return reject(e);
        }

        process.stdout.write(o);
        resolve(file);
      }
    );
  });
const buildArticle = file =>
  new Promise((resolve, reject) => {
    if (argv.update) {
      return resolve(file);
    }

    const args = [
      "blosxom.cgi",
      `path=/${toPOSIXPath(path.relative(destDir, file.dest))}`,
      "reindex=1"
    ];

    execFile(
      exec.perl,
      args,
      {
        cwd: blosxomDir,
        env: {
          BLOSXOM_CONFIG_DIR: path.resolve(blosxomDir)
        }
      },
      (e, o) => {
        if (e) {
          return reject(e);
        }

        file.contents = minifyHTML(
          o
            .replace(/^[\s\S]*?\r?\n\r?\n/, "")
            .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
            .trim()
        );
        resolve(file);
      }
    );
  });
const saveFile = file =>
  new Promise((resolve, reject) => {
    if (argv.update) {
      return resolve(file);
    }

    const writeOptions = {
      flags: "w"
    };

    if (argv.publish) {
      writeOptions.flags = "wx";
    }

    fs.outputFile(file.dest, file.contents, writeOptions, e => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
const testArticle = file =>
  new Promise((resolve, reject) => {
    execFile(exec.htmlhint, ["--format", "compact", file.dest], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
const runDocs = file =>
  new Promise((resolve, reject) => {
    execFile(exec.npm, ["run", "docs"], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
const updateEntry = file => {
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

  return waterfall(
    [
      readEntry,
      addEntry,
      commitEntry,
      updateCache,
      listArticleImages,
      copyArticleImages,
      runDocsArticle,
      buildArticle,
      saveFile,
      testArticle,
      runDocs
    ],
    file
  );
};
const isDraft = file => {
  if (
    [".html", ".markdown", ".md", ".txt"].indexOf(path.extname(file)) !== -1
  ) {
    return true;
  }

  return false;
};
const listDrafts = () =>
  new Promise((resolve, reject) => {
    fs.readdir(draftDir, (e, f) => {
      if (e) {
        return reject(e);
      }

      resolve(f.filter(isDraft));
    });
  });
const getDraft = file =>
  new Promise((resolve, reject) => {
    file = path.join(draftDir, file);
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve({
        contents: d,
        ext: path.extname(file),
        name: path.basename(file, path.extname(file)),
        src: file
      });
    });
  });
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
const checkSelected = file =>
  new Promise((resolve, reject) => {
    if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(file.name)) {
      return reject(
        new Error("This draft does not have a valid name for file.")
      );
    }

    if (!file.contents.startsWith("# ") && !file.contents.startsWith("<h1>")) {
      return reject(new Error("This draft does not have a title."));
    }

    resolve(file);
  });
const markupSelected = file =>
  new Promise(resolve => {
    if (file.ext !== ".html") {
      file.contents = markdown(file.contents);
    }

    resolve(file);
  });
const deleteDraft = file =>
  new Promise((resolve, reject) => {
    fs.unlink(file.src, e => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
const publishSelected = file =>
  waterfall([saveFile, deleteDraft, updateEntry], file);
const readTemplate = file =>
  new Promise((resolve, reject) => {
    fs.readFile(file.template, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve(file);
    });
  });
const buildPreview = file =>
  new Promise(resolve => {
    file.contents = mustache
      .render(file.template, file)
      .replace(/="\/img\//g, '="../src/img/')
      .replace(/="\//g, '="../dist/');
    resolve(file);
  });
const openPreview = file =>
  new Promise((resolve, reject) => {
    execFile(exec.open, [file.dest], e => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
const previewSelected = file =>
  waterfall([readTemplate, buildPreview, saveFile, openPreview], file);
const processSelected = file => {
  if (argv.publish) {
    file.dest = path.join(srcDir, `${file.name}.txt`);

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

process.chdir(__dirname);
Promise.all(Object.keys(exec).map(findExec))
  .then(() => {
    if (argv.update) {
      return updateEntry({
        dest: path.resolve(argv.file)
      });
    }

    return waterfall([
      listDrafts,
      getDrafts,
      selectDraft,
      checkSelected,
      markupSelected,
      processSelected
    ]);
  })
  .catch(e => {
    console.trace(e);
  });
