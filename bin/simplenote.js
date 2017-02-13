#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const map = require("async").map;
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const path = require("path");
const pit = require("pit-ro");
const readline = require("readline");
const request = require("request");
const waterfall = require("async").waterfall;
const which = require("which").sync;

const argv = minimist(process.argv.slice(2), {
  alias: {
    "p": "publish"
  },
  boolean: [
    "publish"
  ]
});
const cache = path.join(__dirname, "../cache/", "simplenote.json");
const config = pit.get("simplenote.com");
const dir = {
  entry: path.resolve(__dirname, "../src/weblog/entries/"),
  root: path.resolve(__dirname, "../"),
  temp: path.resolve(__dirname, "../tmp/")
};
const git = which("git");
const headers = {
  "User-Agent": "sn/0.0.0"
};
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
  }), getNote, (e, r) => {
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

function saveFile(selected, html, filepath, next) {
  fs.outputFile(filepath, html, (e) => {
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

function stageEntry(filepath, next) {
  execFile(git, [
    "add",
    "--",
    filepath
  ], {
    cwd: dir.root
  }, (e) => {
    if (e) {
      return next(e);
    }

    next(null, filepath);
  });
}

function commitEntry(filepath, next) {
  execFile(git, [
    "commit",
    `--message="Add ${path.relative(dir.root, filepath).replace(/\\/g, "/")}"`
  ], {
    cwd: dir.root
  }, (e) => {
    if (e) {
      return next(e);
    }

    next(null, filepath);
  });
}

function createArticle(filepath, next) {
  execFile(which("npm"), [
    "run",
    "blog",
    "--",
    `--file=${filepath}`,
    "--reindex"
  ], (e) => {
    if (e) {
      return next(e);
    }

    next(null, filepath);
  });
}

function publishArticle(filepath, next) {
  execFile(which("npm"), [
    "run",
    "articles",
    "--",
    `--file=${filepath}`
  ], (e) => {
    if (e) {
      return next(e);
    }

    next(null);
  });
}

function publishSelected(selected, body, filepath) {
  waterfall([
    saveFile.bind(null, selected, body, filepath),
    deleteSelected,
    stageEntry,
    commitEntry,
    createArticle,
    publishArticle
  ], (e) => {
    if (e) {
      throw e;
    }
  });
}

function openPreview(selected, filepath, next) {
  execFile(which("open"), [filepath], (e) => {
    if (e) {
      return next(e);
    }

    next(null);
  });
}

function previewSelected(selected, body, filepath) {
  waterfall([
    saveFile.bind(null, selected, body, filepath),
    openPreview
  ], (e) => {
    if (e) {
      throw e;
    }
  });
}

waterfall([
  getToken,
  renewToken,
  storeToken,
  listNotes,
  getNotes,
  selectNote
], (e, s) => {
  if (e) {
    throw e;
  }

  s.content = s.content.trim();

  if (!/\n[a-z0-9][-a-z0-9]*[a-z0-9]$/.test(s.content)) {
    throw new Error("This note does not have a name for file.");
  }

  let body = s.content.split("\n");
  const name = body.pop();

  body = markdown(body.join("\n"));

  if (argv.publish) {
    return publishSelected(s, body, path.join(dir.entry, `${name}.txt`));
  }

  previewSelected(s, `<!DOCTYPE html>
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
        ${body}
      </article>
    </main>
  </body>
</html>`.replace(/="\//g, "=\"../dist/"), path.join(dir.temp, `${name}.html`));
});
