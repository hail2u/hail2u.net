'use strict';

module.exports = function (grunt) {
  var taskName = 'gitcommit';
  var taskDescription = 'Add and commit (and push) with Git.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var path = require('path');

    var done = this.async();
    var options = this.options({
      all: false,
      branch: 'master',
      message: 'Commit',
      push: false,
      remote: 'origin',
      root: './'
    });
    var file = grunt.option('file');
    var message = options.message;
    var cmd = 'git';
    var opts = {
      cwd: options.root,
      stdio: 'inherit'
    };

    if (file) {
      file = path.resolve(file);
      file = path.relative(options.root, file);
      file = file.replace(/\\/g, '/');

      if (file.indexOf('../src/weblog/entries/') === 0) {
        file = file.replace(/\.\.\/src\/weblog\/entries\//, 'blog/');
        file = file.replace(/\.txt$/, '.html');
      }

      message = message + ' ' + file;
    } else {
      file = '--all';
    }

    if (options.all) {
      file = '--all';
    }

    async.series({
      add: function (next) {
        grunt.util.spawn({
          cmd: cmd,
          args: [
            'add',
            file
          ],
          opts: opts
        }, function (error, result, code) {
          next(error);
        });
      },

      commit: function (next) {
        grunt.util.spawn({
          cmd: cmd,
          args: [
            'commit',
            '-m',
            message
          ],
          opts: opts
        }, function (error, result, code) {
          next(error);
        });
      },

      push: function (next) {
        if (!options.push) {
          return next();
        }

        grunt.util.spawn({
          cmd: cmd,
          args:  [
            'push',
            options.remote,
            options.branch
          ],
          opts: opts
        }, function (error, result, code) {
          next(error);
        });
      }
    }, function (error, results) {
      done(error);
    });
  });
};
