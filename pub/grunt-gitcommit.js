/*jshint node:true*/
'use strict';

module.exports = function (grunt) {
  var taskName = 'gitcommit';
  var taskDescription = 'Commit changes to the Git repository.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var path = require('path');

    var done = this.async();
    var options = this.options({
      cwd: './',
      message: 'Commit'
    });

    this.filesSrc.forEach(function (file) {
      file = path.relative(options.cwd, file);

      grunt.util.spawn({
        cmd: 'git',
        args: ['add', file],
        opts: {
          cwd: options.cwd,
          stdio: 'inherit'
        }
      }, function (err, result, code) {
        if (err) {
          done(err);
        }

        grunt.util.spawn({
          cmd: 'git',
          args: ['commit', '-m', options.message + ' ' + file],
          opts: {
            cwd: options.cwd,
            stdio: 'inherit'
          }
        }, function (err, result, code) {
          done(err);
        });
      });
    });
  });
};
