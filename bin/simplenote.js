#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs");
const map = require("async").mapLimit;
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const pit = require("pit-ro");
const readline = require("readline");
const request = require("request");
const waterfall = require("async").waterfall;
const which = require("which");

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
const endpoint = {
  auth: "https://app.simplenote.com/api/login",
  data: "https://app.simplenote.com/api2/data",
  index: "https://app.simplenote.com/api2/index"
};
const headers = {
  "User-Agent": "sn/0.0.0"
};

function getToken(next) {
  fs.readFile(cache, "utf8", (e, d) => {
    if (e) {
      return next(null, null);
    }

    d = JSON.parse(d);

    if ((Date.now() - Date.parse(d.datetime)) > (1000 * 60 * 60 * 23)) {
      return next(null, null);
    }

    next(null, d.token);
  });
}

function renewToken(token, next) {
  if (token) {
    return next(null, token, null);
  }

  request.post(endpoint.auth, {
    body: Buffer.from(`email=${config.email}&password=${config.password}`).toString("base64"),
    headers: headers
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
  if (!datetime) {
    return next(null, token);
  }

  fs.writeFile(cache, JSON.stringify({
    datetime: datetime,
    token: token
  }, null, 2), (e) => {
    if (e) {
      return next(e);
    }

    next(null, token);
  });
}

function listNotes(token, next) {
  config.auth = `auth=${token}&email=${encodeURIComponent(config.email)}`;
  request.get(`${endpoint.index}?length=100&${config.auth}`, {
    headers: headers
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
  request.get(`${endpoint.data}/${note.key}?${config.auth}`, {
    headers: headers
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

  selected.content = body.join("\n");
  selected.path = name;
  next(null, selected);
}

function markupSelected(selected, next) {
  selected.content = markdown(selected.content);
  next(null, selected);
}

function mkdirEntry(entry, next) {
  mkdirp(path.dirname(entry.path), (e) => {
    if (e) {
      return next(e);
    }

    next(null, entry);
  });
}

function saveEntry(entry, next) {
  fs.writeFile(entry.path, entry.content, {
    flag: "wx"
  }, (e) => {
    if (e) {
      return next(e);
    }

    next(null, entry);
  });
}

function deleteSelected(selected, next) {
  request.post(`${endpoint.data}/${selected.key}?${config.auth}`, {
    body: JSON.stringify({
      deleted: 1
    }),
    headers: headers
  }, (e, r) => {
    if (e) {
      return next(e);
    }

    if (r.statusCode !== 200) {
      return next(new Error(r.statusMessage));
    }

    next(null, selected);
  });
}

function findGit(entry, next) {
  which("git", (e, p) => {
    if (e) {
      return next(e);
    }

    next(null, entry, p);
  });
}

function addEntry(entry, git, next) {
  execFile(git, [
    "add",
    "--",
    entry.path
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, entry, git);
  });
}

function commitEntry(entry, git, next) {
  execFile(git, [
    "commit",
    `--message=Add ${path.relative(dir.root, entry.path).replace(/\\/g, "/")}`,
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, entry);
  });
}

function findNpm(entry, next) {
  which("npm", (e, p) => {
    if (e) {
      return next(e);
    }

    next(null, entry, p);
  });
}

function runBlog(entry, npm, next) {
  execFile(npm, [
    "run",
    "blog",
    "--",
    `--file=${entry.path}`,
    "--reindex"
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null, entry, npm);
  });
}

function runArticles(entry, npm, next) {
  execFile(npm, [
    "run",
    "articles",
    "--",
    `--file=${entry.path}`
  ], (e, o) => {
    if (e) {
      return next(e);
    }

    process.stdout.write(o);
    next(null);
  });
}

function publishSelected(selected) {
  waterfall([
    mkdirEntry.bind(null, selected),
    saveEntry,
    deleteSelected,
    findGit,
    addEntry,
    commitEntry,
    findNpm,
    runBlog,
    runArticles
  ], (e) => {
    if (e) {
      throw e;
    }
  });
}

function savePreview(preview, next) {
  fs.writeFile(preview.path, preview.content, (e) => {
    if (e) {
      return next(e);
    }

    next(null, preview);
  });
}

function findOpen(preview, next) {
  which("open", (e, p) => {
    if (e) {
      return next(e);
    }

    next(null, preview, p);
  });
}

function openPreview(preview, open, next) {
  execFile(open, [preview.path], (e) => {
    if (e) {
      return next(e);
    }

    next(null);
  });
}

function previewSelected(selected) {
  waterfall([
    savePreview.bind(null, selected),
    findOpen,
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
], (e, s) => {
  if (e) {
    throw e;
  }

  if (argv.publish) {
    s.path = path.join(dir.entry, `${s.path}.txt`);

    return publishSelected(s);
  }

  s.content = `<!DOCTYPE html>
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
        ${s.content}
      </article>
    </main>
  </body>
</html>`.replace(/="\//g, "=\"../dist/");
  s.path = path.join(dir.temp, `${s.path}.html`);
  previewSelected(s);
});
