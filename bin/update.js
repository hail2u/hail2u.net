#!/usr/bin/env node

"use strict";

const execFile = require("child_process").execFile;
const minimist = require("minimist");
const path = require("path");
const toPOSIXPath = require("../lib/to-posix-path");
const waterfall = require("../lib/waterfall");
const which = require("which").sync;

const argv = minimist(process.argv.slice(2));
const git = which("git");
const npm = which("npm");
const root = "../";

function add(file) {
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

function commit(file) {
  return new Promise((resolve, reject) => {
    execFile(git, [
      "commit",
      `--message=Add ${toPOSIXPath(path.relative(root, file))}`,
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function build(file) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "blog",
      "--",
      `--file=${file}`
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve(file);
    });
  });
}

function test(file) {
  return new Promise((resolve, reject) => {
    execFile(npm, [
      "run",
      "test_html_arg",
      "--",
      file
    ], (e, o) => {
      if (e) {
        return reject(e);
      }

      process.stdout.write(o);
      resolve();
    });
  });
}

function finalize() {
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

process.chdir(__dirname);
waterfall([
  add,
  commit,
  build,
  test,
  finalize
], path.resolve(argv.file)).catch((e) => {
  console.error(e.stack);
  process.exit(1);
});
