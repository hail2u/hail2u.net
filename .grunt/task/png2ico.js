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

    this.files.forEach(function (file) {
      args.push(file.dest);
      args = args.concat(file.src);
      grunt.util.spawn({
        cmd: cmd,
        args: args,
        opts: opts
      }, function (error, result, code) {
        if (error) {
          done(error);
        }

        grunt.log.writeln('File "' + file.dest + '" created.');
        done();
      });
    });
  });
};
