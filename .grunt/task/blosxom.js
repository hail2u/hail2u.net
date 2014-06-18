/* jshint node:true */
'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom files.';

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

    if (this.target === 'category') {
      file = path.dirname(file) + '/index.html';
    }

    file = file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    args.push('path=/' + file);

    if (file === 'index.rss') {
      file = 'feed';
    }

    if (options.reindex) {
      args.push('reindex=1');
    }

    grunt.util.spawn({
      cmd: 'C:/strawberry/perl/bin/perl',
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
