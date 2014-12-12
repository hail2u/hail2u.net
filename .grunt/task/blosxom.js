'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var fs = require('fs');
    var path = require('path');
    var ProgressBar = require('progress');

    var done = this.async();
    var options = this.options({
      all: false,
      feed: false,
      index: false,
      reindex: false
    });
    var args = ['blosxom.cgi'];
    var file = grunt.option('file');
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
    } else if (file) {
      if (path.resolve(file) === path.normalize(file)) {
        file = path.relative(options.datadir, file);
        files.unshift(file);
      }

      if (options.index) {
        file = path.join(path.dirname(file), 'index.html');
        files.push(file);
      }
    }

    files = files.map(function (file) {
      return file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    });

    if (files.length > 8) {
      num = 8;
    }

    async.eachLimit(files, num, function (file, next) {
      grunt.util.spawn({
        cmd: 'C:/perl/bin/perl',
        args: args.concat('path=/' + file),
        opts: {
          cwd: options.rootdir,
          env: {
            BLOSXOM_CONFIG_DIR: path.resolve(options.rootdir)
          }
        }
      }, function (error, result, code) {
        if (error) {
          return next(error);
        }

        if (file === 'index.rss') {
          file = 'feed';
        }

        var contents = result.stdout.replace(/^[\s\S]*?\r?\n\r?\n/, '').trim() +
          '\n';
        file = options.staticdir + file;
        fs.writeFileSync(file, contents);

        if (bar) {
          bar.tick();
        } else {
          grunt.log.writeln('File "' + file + '" created.');
        }

        if (num === 1 && args.length === 2) {
          args.pop();
        }

        next();
      });
    }, function (error) {
      done(error);
    });
  });
};
