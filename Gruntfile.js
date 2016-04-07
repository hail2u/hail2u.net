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
      },

      css: {
        cwd: "tmp/",
        dest: "dist/styles/",
        expand: true,
        src: [
          "*.css",
          "*.css.map"
        ]
      },

      styleGuide: {
        options: {
          process: function (content) {
            var path = {
              img: "../img/",
              js: "../js/"
            };
            var re = /(href|src)(=)(")(.*?)(")/g;
            var site = "https://hail2u.net/";

            return content.replace(re, function (m, at, eq, oq, url, cq) {
              if (url.indexOf(site) === 0) {
                url = url.substr(site.length - 1);
              } else if (url.indexOf(path.img) === 0) {
                url = "/images" + url.substr(path.img.length - 1);
              } else if (url.indexOf(path.js) === 0) {
                url = "/scripts" + url.substr(path.js.length - 1);
              } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
                url = "/styles/" + url;
              }

              return at + eq + oq + url + cq;
            });
          },
          noProcess: ["*.svg"]
        },

        files: {
          "dist/about/style-guide/index.html": ["src/css/test.html"],
          "dist/images/favicon-large.svg": ["src/img/favicon-large.svg"]
        }
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
    "copy:css",
    "copy:styleGuide"
  ]);

  grunt.registerTask("build:js", [
    "uglify"
  ]);
};
