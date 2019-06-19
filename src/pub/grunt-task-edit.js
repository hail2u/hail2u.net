'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
  });

  grunt.registerTask('edit', function () {
    grunt.util.spawn({
      cmd: 'gvim',
      args: [
        '-p',
        '--remote-tab-silent',
        'Gruntfile.js'
      ],
      options: {
        detached: true
      }
    }, function (error, result, code) {
      if (error) {
        throw error;
      }
    });
  });
};
