'use strict';

/**
 * Gruntfile.js example:
 *
 * module.exports = function (grunt) {
 *   grunt.initConfig({
 *     svg2png: {
 *       apple_touch_icon: {
 *         options: {
 *           // Size of exported PNG
 *           width: 180
 *         },
 *
 *         // Path to exported PNG file
 *         dest: 'build/apple-touch-icon.png',
 *         // Path to source SVG file
 *         src: 'src/img/logo.svg'
 *       }
 *     }
 *   });
 * };
*/

module.exports = function (grunt) {
  var taskName = 'svg2png';
  var taskDescription = 'Generate PNG file from SVG file with Inkscape.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var done = this.async();
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
      grunt.util.spawn({
        cmd: cmd,
        args: args,
        opts: opts
      }, function (error, result, code) {
        done(error);
      });
    });
  });
};
