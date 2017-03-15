#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs-extra");
const markdown = require("../lib/markdown");
const minimist = require("minimist");
const path = require("path");
const pit = require("pit-ro");
const readline = require("readline");
const request = require("request");
const waterfall = require("../lib/waterfall");
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
const endpoint = {
  auth: "https://app.simplenote.com/api/login",
  data: "https://app.simplenote.com/api2/data",
  index: "https://app.simplenote.com/api2/index"
};
const git = which("git");
const headers = {
  "User-Agent": "sn/0.0.0"
};
const npm = which("npm");
const open = which("open");

function renewToken() {
  return new Promise((resolve, reject) => {
    request.post(endpoint.auth, {
      body: Buffer.from(`email=${config.email}&password=${config.password}`).toString("base64"),
      headers: headers
    }, (e, r, b) => {
      if (e) {
        return reject(e);
      }

      if (r.statusCode !== 200) {
        return reject(new Error(r.statusMessage));
      }

      resolve([encodeURIComponent(b.trim()), new Date().toJSON()]);
    });
  });
}

function saveCache([token, datetime]) {
  return new Promise((resolve, reject) => {
    fs.outputJSON(cache, {
      datetime: datetime,
      token: token
    }, {
      spaces: 2
    }, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(token);
    });
  });
}

function getToken() {
  return new Promise((resolve, reject) => {
    fs.readJSON(cache, "utf8", (e, d) => {
      if (e) {
        return reject();
      }

      if ((Date.now() - Date.parse(d.datetime)) > (1000 * 60 * 60 * 23)) {
        return reject();
      }

      resolve(d.token);
    });
  }).catch(() => {
    return waterfall([
      renewToken,
      saveCache
    ]);
  });
}

function isDraft(note) {
  if (note.deleted === 1) {
    return false;
  }

  if (argv.publish && !note.tags.includes("draft")) {
    return false;
  }

  return true;
}

function listNotes(token) {
  return new Promise((resolve, reject) => {
    config.auth = `auth=${token}&email=${encodeURIComponent(config.email)}`;
    request.get(`${endpoint.index}?length=100&${config.auth}`, {
      headers: headers
    }, (e, r, b) => {
      if (e) {
        return reject(e);
      }

      if (r.statusCode !== 200) {
        return reject(new Error(r.statusMessage));
      }

      resolve(JSON.parse(b).data.filter(isDraft));
    });
  });
}

function getNote(note) {
  return new Promise((resolve, reject) => {
    request.get(`${endpoint.data}/${note.key}?${config.auth}`, {
      headers: headers
    }, (e, r, b) => {
      if (e) {
        return reject(e);
      }

      if (r.statusCode !== 200) {
        return reject(new Error(r.statusMessage));
      }

      resolve(JSON.parse(b));
    });
  });
}

function getNotes(notes) {
  return Promise.all(notes.map(getNote));
}

function cut(body, length) {
  return body.join("")
    .replace(/<.*?>/g, "")
    .split("")
    .reduce((a, c) => {
      if (length < 2) {
        return a;
      }

      if (c.charCodeAt() > 255) {
        length = length - 1;
      }

      length = length - 1;

      if (length === 1) {
        return `${a}${c}....`;
      }

      if (length === 0) {
        return `${a}${c}...`;
      }

      return `${a}${c}`;
    }, "");
}

function showNote(menu, note, index) {
  const [title, ...body] = note.content.trim().split(/\n+/);

  menu.write(`${index + 1}. ${title.replace(/^# /, "")}
   ${cut(body, 66)}
`);
}

function selectNote(notes) {
  return new Promise((resolve, reject) => {
    const menu = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    menu.write("\n");
    menu.write("0. QUIT\n");
    notes.forEach(showNote.bind(null, menu));
    menu.question("Which one: (0) ", (a) => {
      if (!a) {
        a = 0;
      }

      a = parseInt(a, 10);

      if (!Number.isInteger(a) || a > notes.length) {
        return reject(new Error(`You must enter a number between 0 and ${notes.length}`));
      }

      if (a === 0) {
        process.exit(0);
      }

      menu.close();
      resolve(notes[a - 1]);
    });
  });
}

function checkSelected(selected) {
  return new Promise((resolve, reject) => {
    const body = selected.content.trim().split("\n");
    const name = body.pop();

    if (!/^[a-z0-9][-.a-z0-9]*[a-z0-9]$/.test(name)) {
      return reject(new Error("This note does not have a name for file."));
    }

    selected.content = body.join("\n");
    selected.path = name;
    resolve(selected);
  });
}

function markupSelected(selected) {
  return new Promise((resolve) => {
    selected.content = markdown(selected.content);
    resolve(selected);
  });
}

function saveEntry(entry) {
  return new Promise((resolve, reject) => {
    fs.outputFile(entry.path, entry.content, {
      flag: "wx"
    }, (e) => {
      if (e) {
        return reject(e);
      }

      resolve(entry);
    });
  });
}

function deleteSelected(selected) {
  return new Promise((resolve, reject) => {
    request.post(`${endpoint.data}/${selected.key}?${config.auth}`, {
      body: JSON.stringify({
        deleted: 1
      }),
      headers: headers
    }, (e, r) => {
      if (e) {
        return reject(e);
      }

      if (r.statusCode !== 200) {
        return reject(new Error(r.statusMessage));
      }

      resolve(selected);
    });
  });
}

function addEntry(entry) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "add",
      "--",
      entry.path
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(entry);
    });
  });
}

function commitEntry(entry) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "commit",
      `--message=Add ${path.relative(dir.root, entry.path).replace(/\\/g, "/")}`,
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(entry);
    });
  });
}

function runBlog(entry) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "blog",
      "--",
      `--file=${entry.path}`,
      "--reindex"
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(entry);
    });
  });
}

function runArticles(entry) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "articles",
      "--",
      `--file=${entry.path}`
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
    saveEntry,
    deleteSelected,
    addEntry,
    commitEntry,
    runBlog,
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
    selected.path = path.join(dir.entry, `${selected.path}.txt`);

    return publishSelected(selected);
  }

  selected.content = `<!DOCTYPE html>
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
      ${selected.content}
    </article>
  </main>
</body>
</html>`.replace(/="\/images\//g, "=\"../src/img/").replace(/="\//g, "=\"../dist/");
  selected.path = path.join(dir.temp, `${selected.path}.html`);

  return previewSelected(selected);
}

process.chdir(__dirname);
waterfall([
  getToken,
  listNotes,
  getNotes,
  selectNote,
  checkSelected,
  markupSelected,
  processSelected
]).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
