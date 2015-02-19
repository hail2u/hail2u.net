'use strict';

module.exports = function (grunt) {
  var taskName = 'gitcommit';
  var taskDescription = 'Add and commit (and push) with Git.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var path = require('path');
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var files = this.filesSrc;
    var options = this.options({
      all: false,
      branch: 'master',
      message: 'Commit',
      push: false,
      remote: 'origin',
      root: './'
    });
    var cmd = which('git');
    var file = grunt.option('file');
    var message = options.message;
    var opts = {
      cwd: options.root,
      stdio: 'inherit'
    };

    if (file && files.length === 0) {
      file = path.resolve(file);
      file = path.relative(options.root, file);
      file = file.replace(/\\/g, '/');

      if (file.indexOf('../src/weblog/entries/') === 0) {
        file = file.replace(/\.\.\/src\/weblog\/entries\//, 'blog/');
        file = file.replace(/\.txt$/, '.html');
      }

      message = message + ' ' + file;
    }

    if (options.all) {
      file = '--all';
    }

    if (file && files.length === 0) {
      files.push(file);
    }

    var git = spawn(cmd, ['add'].concat(files), opts);

    if (git.error) {
      grunt.fail.warn(git.error);
    }

    git = spawn(cmd, [
      'commit',
      '-m',
      message
    ], opts);

    if (git.error) {
      grunt.fail.warn(git.error);
    }

    if (!options.push) {
      return;
    }

    git = spawn(cmd, [
      'push',
      options.remote,
      options.branch
    ], opts);

    if (git.error) {
      grunt.fail.warn(git.error);
    }
  });
};
