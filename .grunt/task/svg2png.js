'use strict';

module.exports = function (grunt) {
  var taskName = 'svg2png';
  var taskDescription = 'Generate PNG file from SVG file with Inkscape.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var spawn = require('child_process').spawnSync;
    var which = require('which').sync;

    var options = this.options({});
    var args = [];
    var cmd = 'inkscape';
    var opts = {
      stdio: 'inherit'
    };

    if (options.height) {
      args.push('-h');
      args.push(options.height);
    }

    if (options.width) {
      args.push('-w');
      args.push(options.width);
    }

    this.files.forEach(function (file) {
      args.push('-f');
      args.push(file.src[0]);
      args.push('-e');
      args.push(file.dest);
      var child = spawn(which(cmd), args, opts);

      if (child.error) {
        grunt.fail.warn(child.error);
      }
    });
  });
};
