'use strict';

module.exports = function (grunt) {
  var taskName = 'gitcommit';
  var taskDescription = 'Add and commit (and push) with Git.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var path = require('path');

    var done = this.async();
    var options = this.options({
      branch: 'master',
      message: 'Commit',
      push: false,
      remote: 'origin',
      root: './'
    });
    var file = '--all';
    var message = options.message;
    var cmd = 'git';
    var opts = {
      cwd: options.root,
      stdio: 'inherit'
    };

    if (this.data.file) {
      file = path.relative(options.root, this.data.file).replace(/\\/g, '/');
    }

    if (file !== '--all') {
      message = message + ' ' + file;
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
            '--message="' + message + '"'
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
