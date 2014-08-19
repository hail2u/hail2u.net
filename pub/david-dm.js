#!/usr/bin/env node

// $ david-dm [<path>]

'use strict';

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');

if (process.argv.length > 2) {
  process.chdir(process.argv[2]);
}

exec('git rev-parse --show-toplevel', function (err, stdout, stderr) {
  if (err) {
    throw err;
  }

  var gitroot = path.normalize(stdout.trim());
  var p = JSON.parse(fs.readFileSync(path.join(gitroot, 'package.json'), 'utf-8'));

  if (!p.repository || p.repository.type !== 'git' || !/\bgithub\.com\//.test(p.repository.url)) {
    throw new Error('Cannot find GitHub repository URL');
  }

  var giturl = p.repository.url;
  var davidurl = 'https://david-dm.org/' + giturl.replace(/^.*?github\.com\/(.*?)\.git$/, '$1');
  exec('open ' + davidurl);
});
