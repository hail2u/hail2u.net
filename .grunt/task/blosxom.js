'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var fs = require('fs-extra');
    var path = require('path');
    var ProgressBar = require('progress');
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var done = this.async();
    var options = this.options({
      all: false,
      feed: false,
      index: false,
      reindex: false
    });
    var args = ['blosxom.cgi'];
    var entry = grunt.option('file');
    var files = [];
    var fileCache = path.resolve(options.rootdir, 'plugins/state/files_index.dat');
    var bar;
    var num = 1;

    if (options.feed) {
      files.push('index.rss');
    }

    if (options.reindex) {
      args.push('reindex=1');
    }

    if (options.all) {
      fs.readdirSync(options.datadir).forEach(function (dir) {
        if (dir === 'themes') {
          return;
        }

        files.push(dir + '\\index.html');
      });

      if (!options.index) {
        fs.readFileSync(
          fileCache,
          'utf8'
        ).split(/\r?\n/).forEach(function (file) {
          if (file === '') {
            return;
          }

          file = path.relative(options.datadir, file.split('=>')[0]);
          files.push(file);
        });
      }

      bar = new ProgressBar('Rebuilding [:bar] :percent :elapsed', {
        total: files.length,
        width: 32
      });
    } else if (entry) {
      if (path.resolve(entry) === path.normalize(entry)) {
        entry = path.relative(options.datadir, entry);
        files.unshift(entry);
      }

      if (options.index) {
        entry = path.join(path.dirname(entry), 'index.html');
        files.push(entry);
      }
    }

    files = files.map(function (file) {
      return file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    });

    if (files.length > 8) {
      num = 8;
    }

    async.eachLimit(files, num, function (file, next) {
      var child = spawn(
        which('C:/perl/bin/perl'),
        args.concat('path=/' + file), {
          cwd: options.rootdir,
          encoding: 'utf8',
          env: {
            BLOSXOM_CONFIG_DIR: path.resolve(options.rootdir)
          }
        }
      );

      if (child.error) {
        return next(child.error);
      }

      if (file === 'index.rss') {
        file = 'feed';
      }

      var contents = child.stdout.replace(
        /^[\s\S]*?\r?\n\r?\n/,
        ''
      ).replace(
        /\b(href|src)(=")(https?:\/\/hail2u\.net\/)/g,
        '$1$2/'
      ).trim() + '\n';
      file = options.staticdir + file;
      fs.outputFileSync(file, contents);

      if (bar) {
        bar.tick();
      } else {
        grunt.log.writeln('File "' + file + '" created.');
      }

      if (num === 1 && args.length === 2) {
        args.pop();
      }

      next();
    }, function (error) {
      done(error);
    });
  });
};
