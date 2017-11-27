#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
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
    "publish",
    "update"
  ]
});
const dir = {
  blog: "../dist/blog/",
  draft: path.join(os.homedir(), "Documents", "Drafts"),
  entry: "../src/blosxom/entries/",
  root: "../"
};
const draftExts = [".html", ".markdown", ".md", ".txt"];
const destPreview = "../tmp/__preview.html";
const srcPreview = "../src/preview.mustache";
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
  waterfall([
    addEntry,
    commitEntry,
    runBlosxom,
    testEntry,
    runBuild
  ], file)
    .catch((e) => {
      throw e;
    });
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

function getDraft(draft) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(dir.draft, draft), "utf8", (e, d) => {
      if (e) {
        return reject(e);
      }

      resolve({
        content: d,
        filename: draft,
        name: path.basename(draft, path.extname(draft))
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
      menu.write(`${i + 1}. ${n.content.trim()
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
        throw new Error("Aborted.");
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
    fs.unlink(path.join(dir.draft, selected.filename), (e) => {
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
    runArticles,
    runBuild
  ], selected)
    .catch((e) => {
      throw e;
    });
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

function buildPreview(preview) {
  preview.content = mustache.render(preview.template, preview)
    .replace(/="\/img\//g, "=\"../src/img/")
    .replace(/="\//g, "=\"../dist/");

  return preview;
}

function savePreview(preview) {
  return new Promise((resolve, reject) => {
    fs.outputFile(preview.path, preview.content, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(preview.path);
    });
  });
}

function openPreview(file) {
  return new Promise((resolve, reject) => {
    execFile(open, [file], (e) => {
      if (e) {
        return reject(e);
      }

      resolve();
    });
  });
}

function previewSelected(selected) {
  return waterfall([
    readTemplate,
    buildPreview,
    savePreview,
    openPreview
  ], selected)
    .catch((e) => {
      throw e;
    });
}

function processSelected(selected) {
  if (argv.publish) {
    selected.path = path.join(dir.entry, `${selected.name}.txt`);

    return publishSelected(selected);
  }

  selected.path = path.resolve(destPreview);
  selected.template = path.resolve(srcPreview);

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
  ])
    .catch((e) => {
      throw e;
    });
}

process.chdir(__dirname);

if (argv.update) {
  updateEntry(path.resolve(argv.file));
} else {
  processDrafts();
}
