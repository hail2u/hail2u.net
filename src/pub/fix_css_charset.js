'use strict';

module.exports = function (grunt) {
  var taskName = 'fix_css_charset';
  var taskDescription = 'Fix `@charset` rules in CSS files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var postcss = require('postcss');

    var options = this.options({});

    this.files.forEach(function (file) {
      var fixed = postcss(function (css) {
        var metCharset = false;

        css.eachAtRule(function (atRule) {
          if (atRule.name !== 'charset') {
            return;
          }

          if (!metCharset) {
            metCharset = true;
            atRule.parent.prepend(atRule.clone());
          }

          atRule.removeSelf();
        });

        return css;
      }).process(fs.readFileSync(file.src[0], 'utf8'), options);

      fs.writeFileSync(file.dest, fixed.css);
      grunt.log.writeln('File "' + file.dest + '" created.');

      if (fixed.map) {
        fs.writeFileSync(file.dest + '.map', fixed.map);
        grunt.log.writeln('File "' + file.dest + '.map" created.');
      }
    });
  });
};
