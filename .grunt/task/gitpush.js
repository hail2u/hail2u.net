'use strict';

module.exports = function (grunt) {
  var taskName = 'gitpush';
  var taskDescription = 'Push with Git.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var done = this.async();
    var options = this.options({
      branch: 'master',
      dry_run: true,
      force: false,
      remote: 'origin',
      root: './'
    });
    var args = [
      'push',
      options.remote,
      options.branch
    ];

    if (options.dry_run) {
      args.push('--dry-run');
    }

    if (options.force) {
      args.push('--force');
    }

    grunt.util.spawn({
      cmd: 'git',
      args: args,
      opts: {
        cwd: options.root,
        stdio: 'inherit'
      }
    }, function (error, result, code) {
      done(error);
    });
  });
};
