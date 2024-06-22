/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'rsync';
  var taskDescription = 'Do `$ rsync -aC --exclude-from=.rsyncignore`.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var done = this.async();
    var options = this.options({
      dry_run: true,
      sync: false,
      progress: false
    });
    var flags = grunt.option.flags();
    var args = [
      '-aC',
      '--exclude-from=.rsyncignore'
    ];

    if (flags.indexOf('--verbose') != -1 || flags.indexOf('-v')) {
      args.push('-v');
    }

    if (options.dry_run) {
      grunt.log.writeln('Dry runnning rsync...');
      args.push('-n');
    }

    if (options.sync) {
      args.push('--delete');
    }

    if (options.progress) {
      args.push('--progress');
    }

    if (!options.remote) {
      grunt.fail.warn('Option `remote` not specified.');
    }

    args.push('./', options.remote);
    grunt.verbose.writeln('Running rsync with following options: ' + args.join(' '));
    grunt.util.spawn({
      cmd: 'rsync',
      args: args,
      opts: {
        stdio: 'inherit'
      }
    }, function (error, result, code) {
      done(error);
    });
  });
};
