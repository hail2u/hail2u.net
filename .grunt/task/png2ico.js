'use strict';

module.exports = function (grunt) {
  var taskName = 'png2ico';
  var taskDescription = 'Generate ICO file from multiple PNG files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var options = this.options({
      cmd: 'convert',
    });
    var args = [];
    var opts = {
      stdio: 'inherit'
    };
    this.files.forEach(function (file) {
      args = args.concat(file.src);
      args.push(file.dest);
      var child = spawn(which(options.cmd), args, opts);

      if (child.error) {
        grunt.fail.warn(child.error);
      }

      grunt.log.writeln('File "' + file.dest + '" created.');
    });
  });
};
