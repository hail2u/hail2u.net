'use strict';

module.exports = function (grunt) {
  var taskName = 'blosxom';
  var taskDescription = 'Generate Blosxom files.';

  grunt.registerMultiTask(taskName, taskDescription, function () {
    var fs = require('fs');
    var path = require('path');

    var done = this.async();
    var options = this.options();
    var file = this.data.file;
    var args = ['blosxom.cgi'];

    if (options.reindex) {
      args.push('reindex=1');
    }

    if (path.resolve(file) === path.normalize(file).replace(/[\/\\]+$/, '')) {
      var datadir = path.resolve(options.datadir);
      file = path.relative(datadir, file);
    }

    file = file.replace(/\.txt$/, '.html').replace(/\\/g, '/');
    args.push('path=/' + file);

    if (file === 'index.rss') {
      file = 'feed';
    }

    grunt.util.spawn({
      cmd: 'C:/perl/bin/perl',
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

      var contents = result.stdout.replace(/^[\s\S]*?\r?\n\r?\n/, '').trim() +
        '\n';
      file = options.static_dir + file;
      fs.writeFileSync(file, contents);
      grunt.log.writeln('File "' + file + '" created.');
      done();
    });
  });
};
