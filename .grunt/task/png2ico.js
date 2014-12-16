'use strict';

module.exports = function (grunt) {
  var taskName = 'png2ico';
  var taskDescription = 'Generate ICO file from multiple PNG files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var done = this.async();
    var options = this.options({});

    var args = [];
    var cmd = 'png2ico';
    var opts = {
      stdio: 'inherit'
    };

    if (grunt.option('verbose')) {
      args.push('-verbose');
    }

    this.files.forEach(function (file) {
      args = args.concat(file.src);
      args.push(file.dest);
      grunt.util.spawn({
        cmd: cmd,
        args: args,
        opts: opts
      }, function (error, result, code) {
        if (error) {
          return done(error);
        }

        grunt.log.writeln('File "' + file.dest + '" created.');
        done();
      });
    });
  });
};
