'use strict';

module.exports = function (grunt) {
  var taskName = 'copy_blog_images';
  var taskDescription = 'Copy weblog images.';

  grunt.registerTask(taskName, taskDescription, function () {
    var fs = require('fs-extra');

    var i = 0;
    var f = 'file';
    var images = fs.readFileSync(grunt.option('file'), 'utf-8').match(/\bsrc=".*?"/g);

    if (images) {
      images.forEach(function (image) {
        var src = 'src/img';
        var dest = 'build';
        image = image.replace(/^src="(.*?)"$/, '$1');
        src += image.replace(/^\/images/, '');
        dest += image;

        if (fs.statSync(src).isFile()) {
          fs.copySync(src, dest);
          i++;
          grunt.verbose.writeln('Image "' + src + '" copied to "' + dest + '".');
        }
      });

      if (i > 1) {
        f = 'files';
      }

      grunt.log.writeln(i + ' ' + f + ' copied.');
    } else {
      grunt.log.writeln('Images not found.');
    }
  });
};
