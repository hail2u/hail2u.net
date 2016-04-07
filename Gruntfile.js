"use strict";

module.exports = function (grunt) {
  grunt.util.linefeed = "\n";
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    sass: {
      options: {
        precision: 3,
        sourcemap: "none",
        unixNewlines: true,
        update: true
      },

      main: {
        cwd: "src/css/",
        dest: "tmp/",
        expand: true,
        ext: ".css",
        src: [
          "*.scss",
          "!_*.scss"
        ]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-sass");

  grunt.registerTask("build:css", [
    "sass"
  ]);
};
