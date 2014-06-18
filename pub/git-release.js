#!/usr/bin/env node

'use strict';

var async = require('async');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var semver = require('semver');

var reSemver = /\d+\.\d+\.\d+/;

var incTarget = '';
var root = '';
var targets = [];
var version = '';

async.series({
  inspectIncrementTarget: function (done) {
    process.stdout.write('Inspecting increment target: ');
    incTarget = process.argv[2];

    if (!incTarget.match(/^(major|minor|patch)$/)) {
      done(new Error('Usage: git release [major|minor|patch]'));
    }

    console.log(incTarget);
    done();
  },
  findGitRoot: function (done) {
    process.stdout.write('Finding Git root directory: ');
    exec('git rev-parse --show-toplevel', function (err, stdout, stderr) {
      if (err) {
        done(err);
      }

      root = path.normalize(stdout.replace(/[\r\n]*$/, ''));
      console.log(root);
      done();
    });
  },
  getTargetFiles: function (done) {
    process.stdout.write('Getting target files: ');
    var release = false;
    fs.readFileSync([
      root,
      '.git',
      'config'
    ].join(path.sep), 'utf-8').split('\n').forEach(function (line) {
      if (line.indexOf('[release]') === 0) {
        release = true;

        return;
      } else if (release) {
        if (line.indexOf('[') === 0) {
          return false;
        } else if (line.match(/^\s+target\s+=\s+(.*?):(\d+)$/)) {
          targets.push({
            "file": RegExp.$1,
            "line": RegExp.$2
          });
        }
      }
    });

    if (targets.length === 0) {
      done(new Error('Target file not found.'));
    }

    console.log(targets);
    done();
  },
  increment: function (done) {
    targets.forEach(function (target) {
      var file = path.normalize([root, target.file].join(path.sep));
      var line = target.line;
      process.stdout.write('Incrementing version in: ' + file + ':' + line);
      line = line - 1;
      var data = fs.readFileSync(file, 'utf8').split(/\n/);
      data[line] = data[line].replace(reSemver, function (version) {
        return semver.inc(version, incTarget);
      });
      fs.writeFileSync(file, data.join('\n'));
      console.log(', done.');
    });
    done();
  },
  commit: function (done) {
    process.stdout.write('Commiting changes: ');
    exec('git commit -aevm "Version ' + version + '"', function (err, stdout, stderr) {
      if (err) {
        done(err);
      }

      console.log('done.');
      done();
    });
  },
  tag: function (done) {
    process.stdout.write('Tagging commit: ');
    exec('git tag v' + version, function (err, stdout, stderr) {
      if (err) {
        done(err);
      }

      console.log('done.');
      done();
    });
  }
}, function (err, result) {
  if (err) {
    throw err;
  }

  console.log('Done, without errors.');
});
