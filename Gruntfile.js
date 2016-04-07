"use strict";

module.exports = function (grunt) {
  grunt.util.linefeed = "\n";
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    copy: {
      asitis: {
        files: [
          {
            cwd: "src/",
            dest: "dist/",
            expand: true,
            src: [
              ".nojekyll",
              "CNAME",
              "humans.txt",
              "robots.txt"
            ]
          },
          {
            cwd: "src/html/",
            dest: "dist/",
            expand: true,
            src: ["**/*.html"]
          }
        ]
      }
    },

    css_mqpacker: {
      options: {
        map: {
          inline: false,
          sourcesContent: false
        },
        sort: true
      },

      main: {
        cwd: "tmp/",
        dest: "tmp/",
        expand: true,
        ext: ".min.css",
        src: ["**/*.css"]
      }
    },

    csswring: {
      options: {
        map: true
      },

      main: {
        cwd: "tmp/",
        dest: "tmp/",
        expand: true,
        src: ["**/*.min.css"]
      }
    },

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
    },

    singleCharset: {
      options: {
        map: true
      },

      main: {
        cwd: "tmp/",
        dest: "tmp/",
        expand: true,
        src: ["**/*.min.css"]
      }
    },

    uglify: {
      options: {
        beautify: {
          "ascii_only": true
        },

        preserveComments: "some",
        sourceMap: true
      },

      main: {
        cwd: "tmp/",
        dest: "tmp/",
        expand: true,
        ext: ".min.js",
        src: [
          "**/*.js",
          "!**/*.min.js"
        ]
      }
    }
  });

  grunt.loadNpmTasks("css-mqpacker");
  grunt.loadNpmTasks("csswring");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("postcss-single-charset");

  grunt.registerTask("build", [
    "build:css",
    "build:js",
    "copy:asitis"
  ]);

  grunt.registerTask("build:css", [
    "sass",
    "css_mqpacker",
    "csswring",
    "singleCharset",
  ]);

  grunt.registerTask("build:js", [
    "uglify"
  ]);
};
