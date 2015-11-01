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
          all: true
        }
      },

      article: {
        options: {
          feed: true,
          reindex: true
        }
      },

      index: {
        options: {
          index: true
        }
      }
    },

    clean: {
      main: {
        src: ["tmp/**/*"]
      }
    },

    concat: {
      options: {
        sourceMap: true,
        sourceMapStyle: "link"
      },

      css: {
        files: {
          "tmp/style.min.css": ["tmp/style.min.css"]
        }
      },

      js: {
        options: {
          seperator: ";"
        },

        files: {
          "tmp/main.min.js": [
            "tmp/unutm.min.js"
          ]
        }
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
              "*.txt",
              ".nojekyll",
              "CNAME"
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

      assets: {
        files: [
          {
            cwd: "node_modules/",
            dest: "src/css/assets/partials/",
            expand: true,
            src: [
              "hail2u-scss-functions/**/*",
              "hail2u-scss-partials/**/*"
            ]
          },
          {
            cwd: "node_modules/",
            dest: "src/css/assets/scripts/",
            expand: true,
            flatten: true,
            src: ["unutm/build/unutm.js"]
          },
          {
            cwd: "src/img/",
            dest: "src/css/assets/images/",
            expand: true,
            src: [
              "about/how-i-markup-and-style-this-website.svg",
              "logo.svg",
              "favicon-large.svg"
            ]
          },
          {
            cwd: "src/js/",
            dest: "src/css/assets/scripts/",
            expand: true,
            flatten: true,
            src: ["**/*.js"]
          },
          {
            cwd: "src/woff/",
            dest: "src/css/assets/fonts/",
            expand: true,
            src: ["**/*.woff*"]
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
        src: [
          "**/*",
          "!*.psd",
          "!*.svg",
          "!*.xcf",
          "logo.svg",
          "*/*.svg"
        ]
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

      precss: {
        options: {
          process: function (content) {
            return content.replace(/"assets\/(.*?)"/g, "\"../$1\"");
          }
        },

        cwd: "tmp/",
        dest: "tmp/",
        expand: true,
        src: ["*.css"]
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
            var re = /(href|src)(=)(")(.*?)(")/g;
            var site = "https://hail2u.net/";
            var asset = "assets/";

            return content.replace(re, function (m, at, eq, oq, url, cq) {
              if (url.indexOf(site) === 0) {
                url = url.substr(site.length - 1);
              } else if (url.indexOf(asset) === 0) {
                url = url.substr(asset.length - 1);
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
      },

      woff: {
        cwd: "src/woff/",
        dest: "dist/fonts/",
        expand: true,
        src: ["**/*.woff*"]
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
      blogPublish: {
        options: {
          all: true,
          branch: "gh-pages",
          message: "Add",
          push: true,
          root: "dist/"
        }
      },

      blogUpdate: {
        options: {
          all: true,
          branch: "gh-pages",
          message: "Update",
          push: true,
          root: "dist/"
        }
      },

      cacheUpdate: {
        options: {
          message: "Update cache files"
        },

        src: [
          ".grunt/cache/articles.json",
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

      entryAdd: {
        options: {
          message: "Add"
        }
      },

      entryUpdate: {
        options: {
          message: "Update"
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
        options: {
          cacheLocation: "src/css/.sass-cache/"
        },

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
        files: {
          "tmp/style.min.css": ["tmp/style.min.css"]
        }
      }
    },

    svgRasterizer: {
      appleTouchIcon: {
        options: {
          width: 180
        },

        dest: "dist/apple-touch-icon.png",
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

      favicon48: {
        options: {
          width: 48
        },

        dest: "tmp/favicon-48.png",
        src: "src/img/favicon.svg"
      },

      favicon64: {
        options: {
          width: 64
        },

        dest: "dist/images/favicon-64.png",
        src: "src/img/favicon.svg"
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
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-sass");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-svgmin");
  grunt.loadNpmTasks("postcss-single-charset");
  grunt.loadTasks(".grunt/");

  grunt.registerTask("build", [
    "build:css",
    "build:html",
    "build:img",
    "build:js",
    "copy:asitis",
    "sitemap"
  ]);

  grunt.registerTask("build:article", [
    "clean",
    "blosxom:article",
    "generate:blog",
    "feedmix",
    "sitemap"
  ]);

  grunt.registerTask("build:css", [
    "clean",
    "sass",
    "copy:precss",
    "css_mqpacker",
    "csswring",
    "concat:css",
    "singleCharset",
    "copy:css",
    "copy:styleGuide",
    "copy:woff"
  ]);

  grunt.registerTask("build:html", [
    "clean",
    "generate:main",
    "blosxom:index"
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
    "concat:js",
    "copy:js"
  ]);

  grunt.registerTask("deploy", [
    "build",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("deploy:css", [
    "build:css",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("deploy:html", [
    "build:html",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("deploy:img", [
    "build:img",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("deploy:js", [
    "build:js",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("publish:blog", [
    "gitcommit:entryAdd",
    "build:article",
    "gitcommit:cacheUpdate",
    "gitcommit:blogPublish"
  ]);

  grunt.registerTask("publish:home", [
    "build:html",
    "feedmix",
    "sitemap",
    "gitcommit:deploy"
  ]);

  grunt.registerTask("update:blog", [
    "gitcommit:entryUpdate",
    "build:article",
    "gitcommit:cacheUpdate",
    "gitcommit:blogUpdate"
  ]);
};
