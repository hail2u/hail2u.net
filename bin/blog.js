#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const os = require("os");
const path = require("path");
const readline = require("readline");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "publish",
    "update"
  ]
});
const dir = {
  blog: "../dist/blog/",
  draft: path.join(os.homedir(), "Documents", "Drafts"),
  entry: "../src/weblog/entries/",
  root: "../",
  temp: "../tmp/"
};
const git = which("git");
const htmlhint = which("htmlhint");
const npm = which("npm");
const open = which("open");

function addEntry(file) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "add",
      "--",
      file
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
      `--message=Add ${toPOSIXPath(path.relative(dir.root, file))}`,
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function runBlosxom(file) {
  return new Promise((resolve, reject) => {
    const args = [
      "run",
      "blosxom",
      "--",
      `--file=${file}`
    ];

    if (!argv.update) {
      args.push("--reindex=1");
    }

    execFile(npm, args, (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function testEntry(file) {
  return new Promise((resolve, reject) => {
    execFile(htmlhint, [
      "--config",
      "../.htmlhintrc",
      path.join(
        dir.blog,
        path.relative(dir.entry, path.dirname(file)),
        `${path.basename(file, ".txt")}.html`
      )
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function runPostArticles() {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "postarticles"
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
  waterfall([
    addEntry,
    commitEntry,
    runBlosxom,
    testEntry,
    runPostArticles
  ], file).catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
}

function isDraft(file) {
  const ext = path.extname(file);

  if (
    ext === ".html" ||
    ext === ".markdown" ||
    ext === ".md" ||
    ext === ".txt"
  ) {
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

function getDraft(draft) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(dir.draft, draft), {
      encoding: "utf8"
    }, (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve({
        content: d,
        filename: draft,
        name: path.basename(draft, path.extname(draft)),
        path: draft
      });
    });
  });
}

function getDrafts(drafts) {
  return Promise.all(drafts.map(getDraft));
}

function selectDraft(drafts) {
  return new Promise((resolve, reject) => {
    if (!argv.publish && drafts.length === 1) {
      return resolve(drafts[0]);
    }

    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    menu.write("0. QUIT\n");
    drafts.forEach((n, i) => {
      menu.write(`${i + 1}. ${n.content
        .trim()
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

      if (!Number.isInteger(a) || a > drafts.length) {
        return reject(new Error(`You must enter a number between 0 and ${drafts.length}`));
      }

      if (a === 0) {
        process.exit(0);
      }

      menu.close();
      resolve(drafts[a - 1]);
    });
  });
}

function checkSelected(selected) {
  return new Promise((resolve, reject) => {
    if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(selected.name)) {
      return reject(new Error("This draft does not have a valid name for file."));
    }

    if (
      !selected.content.startsWith("# ") &&
      !selected.content.startsWith("<h1>")
    ) {
      return reject(new Error("This draft does not have a title."));
    }

    resolve(selected);
  });
}

function markupSelected(selected) {
  return new Promise((resolve) => {
    selected.content = markdown(selected.content);
    resolve(selected);
  });
}

function saveSelected(selected) {
  return new Promise((resolve, reject) => {
    fs.outputFile(selected.path, selected.content, {
      flag: "wx"
    }, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(selected);
    });
  });
}

function deleteSelected(selected) {
  return new Promise((resolve, reject) => {
    fs.unlink(path.join(dir.draft, `${selected.filename}`), (e) => {
      if (e) {
        return reject(e);
      }

      resolve(selected.path);
    });
  });
}

function runArticles(file) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "articles",
      "--",
      `--file=${file}`
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve();
    });
  });
}

function publishSelected(selected) {
  return waterfall([
    saveSelected,
    deleteSelected,
    addEntry,
    commitEntry,
    runBlosxom,
    testEntry,
    runArticles
  ], selected);
}

function savePreview(preview) {
  return new Promise((resolve, reject) => {
    fs.outputFile(preview.path, preview.content, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(preview);
    });
  });
}

function openPreview(preview) {
  return new Promise((resolve, reject) => {
    execFile(open, [preview.path], (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function previewSelected(selected) {
  return waterfall([
    savePreview,
    openPreview
  ], selected);
}

function processSelected(selected) {
  if (argv.publish) {
    selected.path = path.join(dir.entry, `${selected.name}.txt`);

    return publishSelected(selected);
  }

  selected.content = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width" name="viewport">
  <title>プレビュー - ウェブログ - Hail2u</title>
  <link href="../src/css/main.css" rel="stylesheet">
</head>
<body>
  <main class="content" style="margin-top: 6rem">
    <article class="section">
      <footer class="section-footer">
        <p><time datetime="1976-07-23">1976/07/23</time></p>
      </footer>
      ${selected.content}
    </article>
  </main>
</body>
</html>`.replace(/="\/img\//g, "=\"../src/img/").replace(/="\//g, "=\"../dist/");
  selected.path = path.join(dir.temp, "__preview.html");

  return previewSelected(selected);
}

function processDrafts() {
  waterfall([
    listDrafts,
    getDrafts,
    selectDraft,
    checkSelected,
    markupSelected,
    processSelected
  ]).catch((e) => {
    console.error(e.stack);
    process.exit(1);
  });
}

process.chdir(__dirname);

if (argv.update) {
  updateEntry(path.resolve(argv.file));
} else {
  processDrafts();
}
