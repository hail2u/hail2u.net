#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const fs = require("fs");
const map = require("async").map;
const path = require("path");
const pit = require("pit-ro");
const readline = require("readline");
const request = require("request");
const waterfall = require("async").waterfall;
const which = require("which").sync;

const config = pit.get("simplenote.com");
const dir = path.resolve(__dirname, "../src/weblog/entries/");
const headers = {
  "User-Agent": "sn/0.0.0"
};
const url = {
  auth: "https://app.simplenote.com/api/login",
  data: "https://app.simplenote.com/api2/data",
  index: "https://app.simplenote.com/api2/index"
};

function getToken(next) {
  // TODO: Retrieve token from cache
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

    // TODO: Cache token to file
    next(null, encodeURIComponent(b.trim()));
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

    if (!n.tags.includes("draft")) {
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

    getNotes(JSON.parse(b).data, next);
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
  menu.question("Which one? (0) ", (a) => {
    if (!a) {
      a = 0;
    }

    a = parseInt(a, 10);

    if (!Number.isInteger(a) || a > notes.length) {
      return next(new Error(`You must enter a number between 0 and ${notes.length}`));
    }

    if (a === 0) {
      process.exit(1);
    }

    menu.close();
    next(null, notes[a - 1]);
  });
}

function saveSelected(selected, next) {
  if (!selected.tags.includes("draft")) {
    return next(new Error("This note is not tagged as draft."));
  }

  selected.content = selected.content.trim();

  if (!/\n[a-z0-9][-a-z0-9]*[a-z0-9]$/.test(selected.content)) {
    return next(new Error("This note does not have file name."));
  }

  const body = selected.content.split("\n");
  const filepath = path.join(dir, `${body.pop()}.md`);

  fs.writeFileSync(filepath, body.join("\n").trim());
  next(null, selected, filepath);
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

function toHTML(filepath, next) {
  // TODO: Integrate Markdown processor
  execFile(which("markdown"), [filepath], (e) => {
    if (e) {
      return next(e);
    }

    next(null, filepath);
  });
}

function openEntry(filepath, next) {
  // TODO: Publish or preview here
  execFile(which("open"), [filepath], (e) => {
    if (e) {
      return next(e);
    }

    next(null);
  });
}

waterfall([
  getToken,
  listNotes,
  selectNote,
  saveSelected,
  deleteSelected,
  toHTML,
  openEntry
], (e) => {
  if (e) {
    throw e;
  }
});
