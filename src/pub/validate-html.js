#!/usr/bin/env node

'use strict';

var fs = require('fs');
var request = require('request');

var endpoint = 'http://validator.w3.org/nu/';

var file = process.argv[2];
request({
  uri: endpoint,
  qs: {
    level: 'errors',
    out: 'json'
  },
  method: 'post',
  headers: {
    'Content-Type': 'text/html; charset=UTF-8',
    'User-Agent': 'request'
  },
  body: fs.readFileSync(file, {
    encoding: 'utf8'
  })
}, function (error, response, body) {
  if (error) {
    throw error;
  }

  if (response.statusCode !== 200) {
    throw new Error('"' + endpoint + '" returned error: ' + response.statusCode);
  }

  var messages = JSON.parse(body).messages.slice(2);
  messages.forEach(function (message) {
    if (message.type !== 'error') {
      return;
    }

    var line = (message.lastLine ? message.lastLine : 0);
    var column = (message.firstColumn ? message.firstColumn: 0);
    console.log([file, line, column, message.message].join(':'));
  });

  process.exit(messages.length);
});
