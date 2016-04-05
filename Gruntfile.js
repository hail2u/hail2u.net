"use strict";

module.exports = function (grunt) {
  grunt.util.linefeed = "\n";
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    blosxom: {
      options: {
        datadir: "src/weblog/entries/",
        imgdir: "src/img/blog/",
        rootdir: "src/weblog/",
        staticdir: "dist/blog/",
        staticimgdir: "dist/images/blog/"
      },

      all: {
        options: {
          all: true,
          index: true
        }
      },

      article: {
        options: {
          feed: true,
          reindex: true
        }
      }
    },

    clean: {
      main: {
        src: ["tmp/**/*"]
      }
    },

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

      img: {
        cwd: "src/img/",
        dest: "dist/images/",
        expand: true,
        src: ["**/*"]
      },

      js: {
        cwd: "tmp/",
        dest: "dist/scripts/",
        expand: true,
        src: [
          "**/*.js",
          "**/*.js.map"
        ]
      },

      jsMinified: {
        cwd: "node_modules/unutm/build/",
        dest: "tmp/",
        expand: true,
        src: ["unutm.*"]
      },

      prejs: {
        cwd: "src/js/",
        dest: "tmp/",
        expand: true,
        flatten: true,
        src: ["**/*.js"]
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

    feedmix: {
      options: {
        builder: {
          cdata: true,
          xmldec: {
            encoding: "UTF-8",
            version: "1.0"
          }
        },
        parser: {
          trim: true
        }
      },

      main: {
        dest: "dist/feed",
        src: [
          "src/index.rss",
          "dist/blog/feed"
        ]
      }
    },

    generate: {
      main: {
        cwd: "src/html/",
        dest: "dist/",
        expand: true,
        ext: ".html",
        rename: function (dest, src) {
          if (src.lastIndexOf("theme.html") === src.length - 10) {
            return "src/weblog/entries/themes/html/page";
          }

          return dest + src;
        },
        src: [
          "**/*.mustache",
          "!partial/*"
        ]
      },

      blog: {
        cwd: "src/html/",
        dest: "dist/",
        expand: true,
        ext: ".html",
        src: [
          "blog/index.mustache",
          "index.mustache"
        ]
      }
    },

    gitcommit: {
      cache: {
        options: {
          message: "Update cache files"
        },

        src: [
          "src/weblog/plugins/state/files_index.dat",
          "src/weblog/plugins/state/others_index.dat"
        ]
      },

      deploy: {
        options: {
          all: true,
          branch: "gh-pages",
          message: "Build",
          push: true,
          root: "dist/"
        }
      },

      entry: {
        options: {
          message: "Add"
        }
      },

      upload: {
        options: {
          branch: "gh-pages",
          message: "Add",
          push: true,
          root: "dist/"
        }
      }
    },

    png2ico: {
      options: {
        cmd: "png2ico"
      },

      main: {
        dest: "dist/favicon.ico",
        src: ["tmp/favicon-*.png"]
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

    svgRasterizer: {
      appleTouchIcon: {
        options: {
          width: 180
        },

        dest: "dist/apple-touch-icon-precomposed.png",
        src: "src/img/favicon-large.svg"
      },

      cover: {
        options: {
          width: 180
        },

        dest: "dist/images/cover.png",
        src: "src/img/cover.svg"
      },

      favicon16: {
        options: {
          width: 16
        },

        dest: "tmp/favicon-16.png",
        src: "src/img/favicon.svg"
      },

      favicon32: {
        options: {
          width: 32
        },

        dest: "tmp/favicon-32.png",
        src: "src/img/favicon.svg"
      },

      favicon64: {
        options: {
          width: 64
        },

        dest: "tmp/favicon-64.png",
        src: "src/img/favicon-large.svg"
      },

      favicon256: {
        options: {
          width: 256
        },

        dest: "tmp/favicon-256.png",
        src: "src/img/favicon-large.svg"
      },

      favicon1024: {
        options: {
          width: 1024
        },

        dest: "dist/images/favicon-1024.png",
        src: "src/img/favicon-large.svg"
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

  grunt.loadNpmTasks("@hail2u/grunt-png2ico");
  grunt.loadNpmTasks("@hail2u/grunt-svg-rasterizer");
  grunt.loadNpmTasks("css-mqpacker");
  grunt.loadNpmTasks("csswring");
  grunt.loadNpmTasks("feedmix");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("postcss-single-charset");
  grunt.loadTasks(".grunt/");

  grunt.registerTask("build", [
    "build:css",
    "build:html",
    "build:img",
    "build:js",
    "copy:asitis"
  ]);

  grunt.registerTask("build:blog", [
    "clean",
    "gitcommit:entry",
    "blosxom:article",
    "articles",
    "generate:blog",
    "gitcommit:cache",
    "feedmix"
  ]);

  grunt.registerTask("build:css", [
    "clean",
    "sass",
    "css_mqpacker",
    "csswring",
    "singleCharset",
    "copy:css",
    "copy:styleGuide"
  ]);

  grunt.registerTask("build:home", [
    "clean",
    "build:html",
    "feedmix"
  ]);

  grunt.registerTask("build:html", [
    "clean",
    "bookmarks",
    "generate:main"
  ]);

  grunt.registerTask("build:img", [
    "clean",
    "svgRasterizer",
    "png2ico",
    "copy:img"
  ]);

  grunt.registerTask("build:js", [
    "clean",
    "copy:prejs",
    "uglify",
    "copy:jsMinified",
    "copy:js"
  ]);
};
