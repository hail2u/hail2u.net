"use strict";

module.exports = function (grunt) {
  grunt.util.linefeed = "\n";
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

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
            "tmp/lightbox.min.js",
            "tmp/load-css.min.js",
            "tmp/unutm.min.js"
          ]
        }
      }
    },

    copy: {
      assets: {
        files: [
          {
            cwd: "node_modules/",
            dest: "src/css/assets/partials/",
            expand: true,
            src: [
              "hail2u-scss-functions/**/*",
              "hail2u-scss-partials/**/*",
              "modularized-normalize-scss/**/*"
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
              "about/how-i-markup-and-style-this-website.png",
              "asterisk.svg",
              "favicon.svg",
              "logo.svg",
              "magnifying-glass.svg"
            ]
          },
          {
            cwd: "src/js/",
            dest: "src/css/assets/scripts/",
            expand: true,
            src: [
              "lightbox.js",
              "load-css.js",
              "toggle-column.js",
              "toggle-eyecatch.js",
              "toggle-outline.js",
              "toggle-tagline.js"
            ]
          },
          {
            cwd: "src/woff/",
            dest: "src/css/assets/fonts/",
            expand: true,
            src: [
              "eau-douce/b.woff",
              "eau-douce/b.woff2",
              "eau-douce/r.woff",
              "eau-douce/r.woff2",
              "mplus-1m-latin/b.woff",
              "mplus-1m-latin/b.woff2",
              "mplus-1m-latin/r.woff",
              "mplus-1m-latin/r.woff2"
            ]
          }
        ]
      },

      css: {
        cwd: "tmp/",
        dest: "build/styles/",
        expand: true,
        src: [
          "*.css",
          "*.css.map"
        ]
      },

      cssPre: {
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

      img: {
        cwd: "src/img/",
        dest: "build/images/",
        expand: true,
        src: [
          "**/*.gif",
          "**/*.ico",
          "**/*.jpg",
          "**/*.png",
          "**/*.svg"
        ]
      },

      js: {
        cwd: "tmp/",
        dest: "build/scripts/",
        expand: true,
        src: [
          "**/*.js",
          "**/*.js.map"
        ]
      },

      jsMinified: {
        files: {
          "tmp/unutm.js": "node_modules/unutm/build/unutm.js",
          "tmp/unutm.min.js": "node_modules/unutm/build/unutm.min.js",
          "tmp/unutm.min.js.map": "node_modules/unutm/build/unutm.min.js.map"
        }
      },

      jsPre: {
        files: {
          "tmp/lightbox.js": "src/js/lightbox.js",
          "tmp/load-css.js": "src/js/load-css.js",
          "tmp/toggle-column.js": "src/js/toggle-column.js",
          "tmp/toggle-eyecatch.js": "src/js/toggle-eyecatch.js",
          "tmp/toggle-outline.js": "src/js/toggle-outline.js",
          "tmp/toggle-tagline.js": "src/js/toggle-tagline.js"
        }
      },

      styleGuide: {
        options: {
          process: function (content) {
            var re = /(href|src)(=)(")(.*?)(")/g;
            var site = "http://hail2u.net/";
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
          }
        },

        dest: "build/about/style-guide/index.html",
        src: "src/css/test.html"
      },

      woff: {
        cwd: "src/woff/",
        dest: "build/fonts/",
        expand: true,
        src: [
          "eau-douce/b.woff",
          "eau-douce/b.woff2",
          "eau-douce/r.woff",
          "eau-douce/r.woff2",
          "mplus-1m-latin/b.woff",
          "mplus-1m-latin/b.woff2",
          "mplus-1m-latin/r.woff",
          "mplus-1m-latin/r.woff2"
        ]
      }
    },

    "css_mqpacker": {
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

    png2ico: {
      options: {
        cmd: "png2ico"
      },

      main: {
        dest: "build/favicon.ico",
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

    svgmin: {
      main: {
        cwd: "src/img/",
        dest: "build/images/",
        expand: true,
        ext: ".min.svg",
        src: ["logo.svg"]
      }
    },

    svgRasterizer: {
      appleTouchIcon: {
        options: {
          width: 180
        },

        dest: "build/apple-touch-icon.png",
        src: "src/img/icon.svg"
      },

      cover: {
        options: {
          width: 2560
        },

        cwd: "src/img/",
        dest: "build/images/",
        expand: true,
        ext: ".png",
        src: [
          "about/cc-by-nc.svg",
          "about/how-i-markup-and-style-this-website.svg",
          "about/i-know-what-you-want-to-know.svg",
          "blog/everything-that-i-want-to-forget.svg",
          "documents/publish-what-i-learned.svg",
          "make-things-simple.svg"
        ]
      },

      favicon16: {
        options: {
          width: 16
        },

        dest: "tmp/favicon-16.png",
        src: "src/img/favicon-small.svg"
      },

      favicon256: {
        options: {
          width: 256
        },

        dest: "tmp/favicon-256.png",
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
    },

    blosxom: {
      options: {
        datadir: "src/weblog/entries/",
        imgdir: "src/img/blog/",
        rootdir: "src/weblog/",
        staticdir: "build/blog/",
        staticimgdir: "build/images/blog/"
      },

      all: {
        options: {
          all: true
        }
      },

      article: {
        options: {
          feed: true,
          index: true,
          reindex: true
        }
      },

      index: {
        options: {
          all: true,
          index: true
        }
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
        dest: "build/feed",
        src: [
          "src/feed/index.rss",
          "build/blog/feed"
        ]
      }
    },

    generate: {
      main: {
        cwd: "src/html/",
        dest: "build/",
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
        dest: "build/",
        expand: true,
        ext: ".html",
        src: [
          "blog/index.mustache",
          "index.mustache"
        ]
      }
    },

    gitcommit: {
      assets: {
        options: {
          all: true,
          message: "Update assets",
          root: "src/css/"
        }
      },

      blogPublish: {
        options: {
          all: true,
          branch: "gh-pages",
          message: "Add",
          push: true,
          root: "build/"
        }
      },

      blogUpdate: {
        options: {
          all: true,
          branch: "gh-pages",
          message: "Update",
          push: true,
          root: "build/"
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
          root: "build/"
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
          root: "build/"
        }
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
  grunt.loadTasks(".grunt/task/");

  grunt.registerTask("build", [
    "build:css",
    "build:html",
    "build:img",
    "build:js",
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
    "copy:cssPre",
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
    "svgmin",
    "svgRasterizer",
    "png2ico",
    "copy:img"
  ]);

  grunt.registerTask("build:js", [
    "clean",
    "copy:jsPre",
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

  grunt.registerTask("update:assets", [
    "copy:assets",
    "gitcommit:assets"
  ]);

  grunt.registerTask("update:blog", [
    "gitcommit:entryUpdate",
    "build:article",
    "gitcommit:cacheUpdate",
    "gitcommit:blogUpdate"
  ]);
};
