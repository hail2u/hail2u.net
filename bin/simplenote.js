#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const map = require("async").mapLimit;
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const os = require("os");
const path = require("path");
const pit = require("pit-ro");
const readline = require("readline");
const request = require("request");
const waterfall = require("async").waterfall;
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  boolean: [
    "publish"
  ]
});
const cache = "../cache/simplenote.json";
const config = pit.get("simplenote.com");
const dir = {
  entry: "../src/weblog/entries/",
  root: "../",
  temp: "../tmp/"
};
const git = which("git");
const headers = {
  "User-Agent": "sn/0.0.0"
};
const npm = which("npm");
const url = {
  auth: "https://app.simplenote.com/api/login",
  data: "https://app.simplenote.com/api2/data",
  index: "https://app.simplenote.com/api2/index"
};

function getToken(next) {
  fs.readJSON(cache, (e, d) => {
    if (e) {
      return next(null);
    }

    if ((Date.now() - Date.parse(d.datetime)) > (1000 * 60 * 60 * 23)) {
      return next(null);
    }

    next(null, d.token, d.datetime);
  });
}

function renewToken(token, datetime, next) {
  if (typeof token !== "function") {
    return next(null, token, datetime);
  }

  next = token;
  request({
    body: Buffer.from(`email=${config.email}&password=${config.password}`).toString("base64"),
    headers: headers,
    method: "POST",
    url: url.auth
  }, (e, r, b) => {
    if (e) {
      return next(e);
    }

    if (r.statusCode !== 200) {
      return next(new Error(r.statusMessage));
    }

    next(null, encodeURIComponent(b.trim()), (new Date()).toJSON());
  });
}

function storeToken(token, datetime, next) {
  if (typeof datetime === "function") {
    return next(null, token);
  }

  fs.outputJSON(cache, {
    datetime: datetime,
    token: token
  }, {
    spaces: 2
  }, (e) => {
    if (e) {
      return next(e);
    }

    next(null, token);
  });
}

function listNotes(token, next) {
  config.auth = `auth=${token}&email=${encodeURIComponent(config.email)}`;
  request({
    headers: headers,
    url: `${url.index}?length=100&${config.auth}`
  }, (e, r, b) => {
    if (e) {
      return next(e);
    }

    if (r.statusCode !== 200) {
      return next(new Error(r.statusMessage));
    }

    next(null, JSON.parse(b).data);
  });
}

function getNote(note, next) {
  request({
    headers: headers,
    url: `${url.data}/${note.key}?${config.auth}`
  }, (e, r, b) => {
    if (e) {
      return next(e);
    }

    if (r.statusCode !== 200) {
      return next(new Error(r.statusMessage));
    }

    next(null, JSON.parse(b));
  });
}

function getNotes(notes, next) {
  map(notes.filter((n) => {
    if (n.deleted === 1) {
      return false;
    }

    if (argv.publish && !n.tags.includes("draft")) {
      return false;
    }

    return true;
  }), os.cpus().length - 1, getNote, (e, r) => {
    if (e) {
      return next(e);
    }

    next(null, r);
  });
}

function selectNote(notes, next) {
  const menu = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  menu.write("\n");
  menu.write("0. QUIT\n");
  notes.forEach((n, i) => {
    menu.write(`${i + 1}. ${n.content.trim().split("\n")[0]}\n`);
  });
  menu.question("Which one: (0) ", (a) => {
    if (!a) {
      a = 0;
    }

    a = parseInt(a, 10);

    if (!Number.isInteger(a) || a > notes.length) {
      return next(new Error(`You must enter a number between 0 and ${notes.length}`));
    }

    if (a === 0) {
      process.exit(0);
    }

    menu.close();
    next(null, notes[a - 1]);
  });
}

function checkSelected(selected, next) {
  const body = selected.content.trim().split("\n");
  const name = body.pop();

  if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(name)) {
    throw new Error("This note does not have a name for file.");
  }

  next(null, selected, body, name);
}

function markupSelected(selected, body, name, next) {
  next(null, selected, markdown(body.join("\n")), name);
}

function openEntry(selected, html, filepath, next) {
  fs.open(filepath, "wx", (e, f) => {
    if (e) {
      return next(e);
    }

    next(null, selected, html, filepath, f);
  });
}

function saveEntry(selected, html, filepath, fd, next) {
  fs.outputFile(fd, html, (e) => {
    if (e) {
      return next(e);
    }

    next(null, selected, filepath, fd);
  });
}

function closeEntry(selected, filepath, fd, next) {
  fs.close(fd, (e) => {
    if (e) {
      return next(e);
    }

    next(null, selected, filepath);
  });
}

function deleteSelected(selected, filepath, next) {
  request({
    body: JSON.stringify({
      deleted: 1
    }),
    headers: headers,
    method: "POST",
    url: `${url.data}/${selected.key}?${config.auth}`
  }, (e, r) => {
    if (e) {
      return next(e);
    }

    if (r.statusCode !== 200) {
      return next(new Error(r.statusMessage));
    }

    next(null, filepath);
  });
}

function addEntry(filepath, next) {
  execFile(git, [
    "add",
    "--",
    filepath
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, filepath);
  });
}

function commitEntry(filepath, next) {
  execFile(git, [
    "commit",
    `--message=Add ${path.relative(dir.root, filepath).replace(/\\/g, "/")}`,
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, filepath);
  });
}

function runBlog(filepath, next) {
  execFile(npm, [
    "run",
    "blog",
    "--",
    `--file=${filepath}`,
    "--reindex"
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, filepath);
  });
}

function runArticles(filepath, next) {
  execFile(npm, [
    "run",
    "articles",
    "--",
    `--file=${path.resolve(filepath).replace(/\\/g, "/")}`
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null);
  });
}

function publishSelected(selected, html, filepath) {
  waterfall([
    openEntry.bind(null, selected, html, filepath),
    saveEntry,
    closeEntry,
    deleteSelected,
    addEntry,
    commitEntry,
    runBlog,
    runArticles
  ], (e) => {
    if (e) {
      throw e;
    }
  });
}

function savePreview(html, filepath, next) {
  fs.outputFile(filepath, html, (e) => {
    if (e) {
      return next(e);
    }

    next(null, filepath);
  });
}

function openPreview(filepath, next) {
  execFile(which("open"), [filepath], (e) => {
    if (e) {
      return next(e);
    }

    next(null);
  });
}

function previewSelected(html, filepath) {
  waterfall([
    savePreview.bind(null, html, filepath),
    openPreview
  ], (e) => {
    if (e) {
      throw e;
    }
  });
}

process.chdir(__dirname);
waterfall([
  getToken,
  renewToken,
  storeToken,
  listNotes,
  getNotes,
  selectNote,
  checkSelected,
  markupSelected
], (e, s, h, n) => {
  if (e) {
    throw e;
  }

  if (argv.publish) {
    return publishSelected(s, h, path.join(dir.entry, `${n}.txt`));
  }

  previewSelected(`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta content="width=device-width" name="viewport">
    <title>プレビュー - ウェブログ - Hail2u.net</title>
    <link href="/styles/main.min.css" rel="stylesheet">
  </head>
  <body>
    <main class="content">
      <article class="section">
        <footer class="section-footer">
          <p><time datetime="1976-07-23">1976/07/23</time></p>
        </footer>
        ${h}
      </article>
    </main>
  </body>
</html>`.replace(/="\//g, "=\"../dist/"), path.join(dir.temp, `${n}.html`));
});
