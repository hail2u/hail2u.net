#!/usr/bin/env node

"use strict";

var fs = require("fs-extra");
var codes = require("http").STATUS_CODES;
var minimist = require("minimist");
var path = require("path");
var pit = require("pit-ro");
var request = require("request");

var argv = minimist(process.argv.slice(2), {
  boolean: ["force"]
});
var bookmarks = [];
var cache = "../cache/bookmarks.json";
var config = pit.get("pinboard.in");
var qs = {
  format: "json"
};

cache = path.resolve(__dirname, cache);

if (!argv.force) {
  bookmarks = fs.readJsonSync(cache);
  qs.fromdt = bookmarks[0].time;
}

qs.auth_token = config.username + ":" + config.token;
request.get({
  qs: qs,
  uri: "https://api.pinboard.in/v1/posts/all"
}, function (err, res, body) {
  var newBookmarks;

  if (err) {
    throw err;
  }

  if (res.statusCode !== codes[res.statusCode] === "OK") {
    throw new Error(res.statusMessage);
  }

  newBookmarks = JSON.parse(body).filter(function (link) {
    if (link.toread === "yes") {
      return false;
    }

    return true;
  });

  if (newBookmarks.length > 0) {
    return;
  }

  fs.writeJsonSync(cache, newBookmarks.reverse().concat(
    bookmarks
  ).filter(function (val, idx, arr) {
    return arr.indexOf(val) === idx;
  }));
});
