"use strict";

var fs = require("fs-extra");
var minimist = require("minimist");
var pit = require("pit-ro");
var request = require("request");

var argv = minimist(process.argv.slice(2), {
  boolean: ["force"]
});
var cache = "cache/bookmarks.json";
var config = pit.get("pinboard.in");
var force = argv.force;
var bookmarks = [];
var qs = {
  format: "json"
};

if (!force) {
  bookmarks = fs.readJsonSync(cache);
  qs.fromdt = bookmarks[0].time;
}

qs.auth_token = config.username + ":" + config.token;
request.get({
  qs: qs,
  uri: "https://api.pinboard.in/v1/posts/all"
}, function (error, response, body) {
  var newBookmarks;

  if (error) {
    throw error;
  }

  if (response.statusCode !== 200) {
    throw new Error(response.statusMessage);
  }

  newBookmarks = JSON.parse(body).filter(function (link) {
    if (link.toread === "yes") {
      return false;
    }

    return true;
  });

  if (!force && newBookmarks.length === 0) {
    return;
  }

  if (force) {
    bookmarks = newBookmarks.slice(0);
    newBookmarks = [];
  }

  newBookmarks.reverse().forEach(function (link) {
    bookmarks.unshift(link);
  });
  fs.writeJsonSync(cache, bookmarks);
});
