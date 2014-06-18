/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom file.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var path = require('path');

    var done = this.async();
    var options = this.options();
    var file = this.data.file;
    var args = ['blosxom.cgi'];

    if (grunt.file.isPathAbsolute(file)) {
      var datadir = path.resolve(options.datadir);
      file = path.relative(datadir, file);
    }

    file = file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    args.push('path=/' + file);

    grunt.util.spawn({
      cmd: 'perl',
      args: args,
      opts: {
        cwd: options.root,
        env: {
          BLOSXOM_CONFIG_DIR: path.resolve(options.root)
        }
      }
    }, function (error, result, code) {
      if (error) {
        return done(error);
      }

      var contents = result.toString().replace(/^[\s\S]*?\r?\n\r?\n/, '') + '\n';

      grunt.file.write(options.static_dir + file, contents);
      grunt.log.writeln('File "' + options.static_dir + file + '" created.');
      done();
    });
  });
};
