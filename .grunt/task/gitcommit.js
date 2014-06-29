/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'gitcommit';
  var taskDescription = 'Add and commit (and push) with Git.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var async = require('async');
    var path = require('path');

    var done = this.async();
    var options = this.options({
      root: './',
      message: 'Commit',
      push: false,
      submodule: false
    });
    var file = this.data.file;
    var cmd = 'git';
    var opts = {
      cwd: options.root,
      stdio: 'inherit'
    };

    file = path.relative(options.root, file).replace(/\\/g, '/');

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
	    options.message + ' ' + file
	  ],
          opts: opts
        }, function (error, result, code) {
          next(error);
        });
      },

      sm_add: function (next) {
        if (!options.submodule) {
          return next();
        }

        grunt.util.spawn({
          cmd: cmd,
          args: [
	    'add',
            options.root
	  ],
          opts: {
            stdio: 'inherit'
          }
        }, function (error, result, code) {
          next(error);
        });
      },

      sm_commit: function (next) {
        if (!options.submodule) {
          return next();
        }

        grunt.util.spawn({
          cmd: cmd,
          args: [
	    'commit',
	    '-m',
	    'Update submodules'
	  ],
          opts: {
            stdio: 'inherit'
          }
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
	    'origin',
	    'master'
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
