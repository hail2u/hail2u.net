#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const execFileSync = require("child_process").execFileSync;
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
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "preview",
    "publish",
    "update"
  ]
});
const dir = {
  blog: "../dist/blog/",
  blosxom: "../src/blosxom/",
  draft: path.join(os.homedir(), "Documents", "Drafts"),
  entry: "../src/blosxom/entries/",
  img: "../src/img/blog/",
  root: "../",
  static: "../dist/blog/",
  staticimg: "../dist/img/blog/"
};
const draftExts = [".html", ".markdown", ".md", ".txt"];
const destPreview = "../tmp/__preview.html";
const srcPreview = "../src/preview.mustache";
const git = which("git");
const htmlhint = which("htmlhint");
const npm = which("npm");
const open = which("open");
const perl = which("perl");

function addEntry(file) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "add",
      "--",
      file.src
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function commitEntry(file) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "commit",
      `--message=Add ${toPOSIXPath(path.relative(dir.root, file.src))}`,
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function listArticleImages(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.src, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.images = d.match(/\bsrc="\/img\/blog\/.*?"/g);
      resolve(file);
    });
  });
}

function copyArticleImage(image) {
  image = path.basename(image.split(/"/)[1]);

  return new Promise((resolve, reject) => {
    fs.copy(path.join(dir.img, image), path.join(dir.staticimg, image), (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function copyArticleImages(file) {
  if (!file.images) {
    return file;
  }

  return Promise.all(file.images.map(copyArticleImage))
    .then(() => {
      return file;
    });
}

function buildArticle(file) {
  const args = [
    "blosxom.cgi",
    `path=/${toPOSIXPath(path.relative(dir.static, file.dest))}`
  ];

  if (argv.publish) {
    args.push("reindex=1");
  }

  file.contents = minifyHTML(
    execFileSync(perl, args, {
      cwd: dir.blosxom,
      env: {
        BLOSXOM_CONFIG_DIR: path.resolve(dir.blosxom)
      }
    })
      .toString()
      .replace(/^[\s\S]*?\r?\n\r?\n/, "")
      .replace(/\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g, "$1$2/")
      .trim()
  );

  return file;
}

function saveFile(file) {
  return new Promise((resolve, reject) => {
    fs.outputFile(file.dest, file.contents, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
}

function testArticle(file) {
  return new Promise((resolve, reject) => {
    execFile(htmlhint, [file.dest], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function runCache(file) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "cache",
      "--",
      `--file=${file.src}`
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function runBuild() {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "build"
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve();
    });
  });
}

function updateEntry(file) {
  file.src = file.dest;
  file.dest = path.join(
    dir.static,
    path.relative(dir.entry, path.dirname(file.src)),
    `${path.basename(file.src, ".txt")}.html`
  );

  // return waterfall([
  //   readFile,
  //   addEntry,
  //   commitEntry,
  //   runCache,
  //   listArticleImages,
  //   copyArticleImages,
  //   runRebuild,
  //   testArticle,
  //   runBuild
  // ], file);

  return waterfall([
    addEntry,
    commitEntry,
    listArticleImages,
    copyArticleImages,
    buildArticle,
    saveFile,
    testArticle,
    runCache,
    runBuild
  ], file);
}

function isDraft(file) {
  if (draftExts.indexOf(path.extname(file)) !== -1) {
    return true;
  }

  return false;
}

function listDrafts() {
  return new Promise((resolve, reject) => {
    fs.readdir(dir.draft, (e, f) => {
      if (e) {
        return reject(e);
      }

      resolve(f.filter(isDraft));
    });
  });
}

function getDraft(file) {
  file = path.join(dir.draft, file);

  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve({
        contents: d,
        name: path.basename(file, path.extname(file)),
        src: file
      });
    });
  });
}

function getDrafts(files) {
  return Promise.all(files.map(getDraft));
}

function selectDraft(files) {
  return new Promise((resolve, reject) => {
    if (!argv.publish && files.length === 1) {
      return resolve(files[0]);
    }

    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    menu.write("0. QUIT\n");
    files.forEach((n, i) => {
      menu.write(`${i + 1}. ${n.contents.trim()
        .split(/\n+/)[0]
        .replace(/^# /, "")
        .replace(/^<h1>(.*?)<\/h1>$/, "$1")}
`);
    });
    menu.question("Which one: (0) ", (a) => {
      if (!a) {
        a = 0;
      }

      a = parseInt(a, 10);

      if (!Number.isInteger(a) || a > files.length) {
        return reject(new Error(`You must enter a number between 0 and ${files.length}`));
      }

      if (a === 0) {
        throw new Error("Aborted.");
      }

      menu.close();
      resolve(files[a - 1]);
    });
  });
}

function checkSelected(file) {
  return new Promise((resolve, reject) => {
    if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(file.name)) {
      return reject(new Error("This draft does not have a valid name for file."));
    }

    if (
      !file.contents.startsWith("# ") &&
      !file.contents.startsWith("<h1>")
    ) {
      return reject(new Error("This draft does not have a title."));
    }

    resolve(file);
  });
}

function markupSelected(file) {
  return new Promise((resolve) => {
    file.contents = markdown(file.contents);
    resolve(file);
  });
}

function deleteDraft(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file.src, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(file);
    });
  });
}

function publishSelected(file) {
  // const [title, ...body] = file.contents.trim()
  //   .split("\n");
  //
  // file.article = {
  //   body: body.join("\n")
  //     .trim(),
  //   link: `/blog/${file.name}.html`,
  //   title: title.replace(/<.*?>/g, ""),
  //   unixtime: Date.now()
  // };
  //
  // return waterfall([
  //   saveFile,
  //   deleteDraft,
  //   addEntry,
  //   commitEntry,
  //   runCache,
  //   listArticleImages,
  //   copyArticleImages,
  //   runRebuild,
  //   testArticle,
  //   runBuild
  // ], file);

  return waterfall([
    saveFile,
    deleteDraft,
    updateEntry,
  ], file);
}

function readTemplate(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file.template, "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      file.template = d;
      resolve(file);
    });
  });
}

function buildPreview(file) {
  file.contents = mustache.render(file.template, file)
    .replace(/="\/img\//g, "=\"../src/img/")
    .replace(/="\//g, "=\"../dist/");

  return file;
}

function openPreview(file) {
  return new Promise((resolve, reject) => {
    execFile(open, [file.dest], (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function previewSelected(file) {
  return waterfall([
    readTemplate,
    buildPreview,
    saveFile,
    openPreview
  ], file);
}

function processSelected(file) {
  if (argv.publish) {
    file.dest = path.join(dir.entry, `${file.name}.txt`);

    return publishSelected(file);
  }

  file.dest = path.resolve(destPreview);
  file.template = path.resolve(srcPreview);

  return previewSelected(file);
}

process.chdir(__dirname);
Promise.resolve()
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
  .catch((e) => {
    console.trace(e);
  });
