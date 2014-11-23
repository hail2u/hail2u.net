'use strict';

module.exports = function (grunt) {
  var taskName = 'rebuild_blog';
  var taskDescription = 'Rebuild weblog entries.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var fs = require('fs');
    var path = require('path');
    var ProgressBar = require('progress');
    var spawn = require('child_process').spawn;

    var done = this.async();
    var all = grunt.option('all');
    var dirRoot = path.resolve(__dirname, '../../src/weblog/');
    var dirData = path.resolve(dirRoot, 'entries/');
    var fileCache = path.resolve(dirRoot, 'plugins/state/files_index.dat');
    var dirStatic = path.resolve(__dirname, '../../build/blog/');

    var files = fs.readdirSync(dirData).filter(function (dir) {
      if (dir === 'themes') {
        return false;
      }

      return true;
    }).map(function (dir) {
      return dir + '/index.txt';
    });

    if (all) {
      files = files.concat(fs.readFileSync(fileCache, 'utf8').split(/\r?\n/).filter(function (file) {
        if (file === '') {
          return false;
        }

        return true;
      }).map(function (file) {
        return path.relative(dirData, file.split('=>')[0]).replace(/\\/g, '/');
      }));

      if (all !== true) {
        files = files.filter(function (file) {
          if (file.indexOf(all + '/') === 0) {
            return true;
          }

          return false;
        });
      }
    }

    var bar = new ProgressBar('Rebuilding [:bar] :percent :elapsed', {
      total: files.length,
      width: 32
    });

    async.eachLimit(files, 16, function (file, next) {
      if (!/\/index\.txt$/.test(file) && !fs.existsSync(path.join(dirData, file))) {
        console.error('File "' + file + '" not found.');

        return next();
      }

      file = file.replace(/\.txt$/, '.html');
      var html = '';
      var blosxom = spawn('C:/perl/bin/perl', [
        'blosxom.cgi',
        'path=/' + file
      ], {
        cwd: dirRoot,
        env: {
          BLOSXOM_CONFIG_DIR: path.resolve(dirRoot)
        }
      });

      blosxom.stdout.on('data', function (data) {
        html += data;
      });

      blosxom.stdout.on('end', function (data) {
        html = html.replace(/^[\s\S]*?\r?\n\r?\n/, '').trimRight() + '\n';
        fs.writeFileSync(path.join(dirStatic, file), html);
      });

      blosxom.on('error', function (error) {
        return next(error);
      });

      blosxom.on('exit', function (code) {
        bar.tick();
        next();
      });
    }, function (error) {
      if (error) {
        done(error);
      }

      done();
    });
  });
};
