'use strict';

module.exports = function (grunt) {
  grunt.util.linefeed = '\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      main: {
        src: ['tmp/**/*']
      }
    },

    concat: {
      options: {
        sourceMap: true,
        sourceMapStyle: 'link'
      },

      css: {
        files: {
          'tmp/style.min.css': [
            'tmp/source-sans-pro.min.css',
            'tmp/source-code-pro.min.css',
            'tmp/megrim.min.css',
            'tmp/style.min.css'
          ]
        }
      },

      js: {
        options: {
          seperator: ';',
        },

        files: {
          'tmp/debug.min.js': [
            'tmp/show-column.min.js',
            'tmp/show-outline.min.js',
            'tmp/toggle-tagline.min.js'
          ],
          'tmp/main.min.js': ['tmp/unutm.min.js']
        }
      }
    },

    connect: {
      main: {
        options: {
          base: 'build/',
          keepalive: true,
          open: 'http://localhost:8000/'
        }
      }
    },

    copy: {
      assets: {
        files: [
          {
            cwd: 'node_modules/',
            dest: 'src/css/assets/partials/',
            expand: true,
            src: [
              'hail2u-scss-functions/**/*',
              'hail2u-scss-partials/**/*',
              'modularized-normalize-scss/**/*'
            ]
          },
          {
            cwd: 'build/',
            dest: 'src/css/assets/',
            expand: true,
            src: [
              'apple-touch-icon.png',
              'fonts/**/*',
              'images/about/layout-*.png',
              'images/favicon-16.png',
              'images/favicon-256.png',
              'images/favicon-32.png',
              'images/favicon-48.png',
              'images/icon/facebook.svg',
              'images/icon/feed.svg',
              'images/icon/tumblr.svg',
              'images/icon/twitter.svg',
              'images/logo.svg',
              'scripts/show-column.js',
              'scripts/show-outline.js',
              'scripts/toggle-tagline.js',
              'scripts/unutm.js',
              'styles/colorscheme.aco',
              'styles/megrim.css',
              'styles/source-code-pro.css',
              'styles/source-sans-pro.css'
            ]
          }
        ]
      },

      css: {
        cwd: 'tmp/',
        dest: 'build/styles/',
        expand: true,
        src: [
          '*.css',
          '*.css.map'
        ]
      },

      css_pre: {
        files: {
          'tmp/source-sans-pro.css': 'src/css/assets/styles/source-sans-pro.css',
          'tmp/source-code-pro.css': 'src/css/assets/styles/source-code-pro.css',
          'tmp/megrim.css': 'src/css/assets/styles/megrim.css'
        }
      },

      img: {
        cwd: 'src/img/',
        dest: 'build/images/',
        expand: true,
        src: [
          '**/*.gif',
          '**/*.ico',
          '**/*.jpg',
          '**/*.png',
          '**/*.svg'
        ]
      },

      js: {
        cwd: 'tmp/',
        dest: 'build/scripts/',
        expand: true,
        src: [
          '**/*.js',
          '**/*.js.map'
        ]
      },

      js_minified: {
        files: {
          'tmp/unutm.js': 'node_modules//unutm/build/unutm.js',
          'tmp/unutm.min.js': 'node_modules//unutm/build/unutm.min.js',
          'tmp/unutm.min.js.map': 'node_modules//unutm/build/unutm.min.js.map'
        }
      },

      js_pre: {
        files: {
          'tmp/show-column.js': 'src/js/debug/show-column.js',
          'tmp/show-outline.js': 'src/js/debug/show-outline.js',
          'tmp/toggle-tagline.js': 'src/js/debug/toggle-tagline.js'
        }
      },

      style_guide: {
        options: {
          process: function (content) {
            var re = /(href|src)(=)(")(.*?)(")/g;
            var site = 'http://hail2u.net/';
            var asset = 'assets/';

            return content.replace(re, function (m, at, eq, oq, url, cq) {
              if (url.indexOf(site) === 0) {
                url = url.substr(site.length - 1);
              } else if (url.indexOf(asset) === 0) {
                url = url.substr(asset.length - 1);
              } else if (/^\w+\.\w+$/.test(url)) {
                url = '/styles/' + url;
              }

              return at + eq + oq + url + cq;
            });
          }
        },

        dest: 'build/about/style-guide/index.html',
        src: 'src/css/test.html'
      }
    },

    css_mqpacker: {
      options: {
        map: {
          inline: false,
          sourcesContent: false
        }
      },

      main: {
        cwd: 'tmp/',
        dest: 'tmp/',
        expand: true,
        ext: '.min.css',
        src: ['**/*.css']
      }
    },

    csswring: {
      options: {
        map: true
      },

      main: {
        cwd: 'tmp/',
        dest: 'tmp/',
        expand: true,
        src: [
          '**/*.min.css'
        ]
      }
    },

    pubsubhubbub_publish: {
      main: {
        hubUrl: 'http://hail2u.net/feed'
      },

      blog: {
        hubUrl: 'http://hail2u.net/blog/feed'
      }
    },

    sass: {
      options: {
        precision: 3,
        sourcemap: 'none',
        unixNewlines: true,
        update: true
      },

      main: {
        options: {
          cacheLocation: 'src/css/.sass-cache/'
        },

        cwd: 'src/css/',
        dest: 'tmp/',
        expand: true,
        ext: '.css',
        src: ['*.scss']
      }
    },

    single_charset: {
      options: {
        map: true
      },

      main: {
        files: {
          'tmp/style.min.css': ['tmp/style.min.css']
        }
      }
    },

    svgmin: {
      main: {
        cwd: 'src/img/',
        dest: 'build/images/',
        expand: true,
        ext: '.min.svg',
        src: [
          '**/*.svg',
          '!icon/asterisk.svg',
          '!icon/chain.svg',
          '!icon/magnifying-glass.svg',
          '!**/*.min.svg'
        ]
      }
    },

    uglify: {
      options: {
        beautify: {
          ascii_only: true
        },

        preserveComments: 'some',
        sourceMap: true
      },

      main: {
        cwd: 'tmp/',
        dest: 'tmp/',
        expand: true,
        ext: '.min.js',
        src: [
          '**/*.js',
          '!**/*.min.js'
        ]
      }
    },

    blosxom: {
      options: {
        datadir: 'src/weblog/entries/',
        rootdir: 'src/weblog/',
        staticdir: 'build/blog/'
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

    generate: {
      main: {
        cwd: 'src/html/',
        dest: 'build/',
        expand: true,
        ext: '.html',
        rename: function (dest, src) {
          if (src.lastIndexOf('theme.html') === src.length - 10) {
            return 'src/weblog/entries/themes/html/page';
          }

          return dest + src;
        },
        src: [
          '**/*.mustache',
          '!partial/*'
        ]
      },

      blog: {
        cwd: 'src/html/',
        dest: 'build/',
        expand: true,
        ext: '.html',
        src: [
          'blog/index.mustache',
          'index.mustache'
        ]
      }
    },

    gitcommit: {
      add_entry: {
        options: {
          message: 'Add'
        }
      },

      deploy: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Build',
          push: true,
          root: 'build/'
        }
      },

      publish_blog: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Add',
          push: true,
          root: 'build/'
        }
      },

      update_blog: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Update',
          push: true,
          root: 'build/'
        }
      },

      update_cache: {
        options: {
          message: 'Update cache files'
        },

        src: [
          '.grunt/cache/articles.json',
          'src/weblog/plugins/state/files_index.dat',
          'src/weblog/plugins/state/others_index.dat'
        ]
      },

      update_entry: {
        options: {
          message: 'Update'
        }
      },

      upload: {
        options: {
          branch: 'gh-pages',
          message: 'Add',
          push: true,
          root: 'build/'
        }
      }
    },

    png2ico: {
      options: {
        cmd: 'png2ico'
      },

      main: {
        dest: 'build/favicon.ico',
        src: [
          'build/images/favicon-16.png',
          'build/images/favicon-32.png',
          'build/images/favicon-48.png',
          'build/images/favicon-256.png'
        ]
      }
    },

    svg2png: {
      apple_touch_icon: {
        options: {
          width: 180
        },

        dest: 'build/apple-touch-icon.png',
        src: 'src/img/favicon.svg'
      },

      favicon16: {
        options: {
          width: 16
        },

        dest: 'build/images/favicon-16.png',
        src: 'src/img/favicon.svg'
      },

      favicon32: {
        options: {
          width: 32
        },

        dest: 'build/images/favicon-32.png',
        src: 'src/img/favicon.svg'
      },

      favicon48: {
        options: {
          width: 48
        },

        dest: 'build/images/favicon-48.png',
        src: 'src/img/favicon.svg'
      },

      favicon256: {
        options: {
          width: 256
        },

        dest: 'build/images/favicon-256.png',
        src: 'src/img/favicon.svg'
      },

      favicon1024: {
        options: {
          width: 1024
        },

        dest: 'build/images/favicon-1024.png',
        src: 'src/img/favicon.svg'
      }
    }
  });

  grunt.loadNpmTasks('css-mqpacker');
  grunt.loadNpmTasks('csswring');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-pubsubhubbub_publish');
  grunt.loadNpmTasks('grunt-svgmin');
  grunt.loadNpmTasks('postcss-single-charset');
  grunt.loadTasks('.grunt/task/');

  grunt.registerTask('build', [
    'build:css',
    'build:img',
    'build:js',
    'build:html',
    'sitemap'
  ]);

  grunt.registerTask('build:blog', [
    'blosxom:article',
    'generate:blog',
    'merge_feeds',
    'sitemap'
  ]);

  grunt.registerTask('build:css', [
    'clean',
    'copy:css_pre',
    'sass',
    'css_mqpacker',
    'csswring',
    'concat:css',
    'single_charset',
    'copy:css',
    'copy:style_guide',
  ]);

  grunt.registerTask('build:html', [
    'generate:main',
    'blosxom:index'
  ]);

  grunt.registerTask('build:img', [
    'svgmin',
    'svg2png:apple_touch_icon',
    'svg2png:favicon16',
    'svg2png:favicon32',
    'svg2png:favicon48',
    'svg2png:favicon256',
    'svg2png:favicon1024',
    'png2ico',
    'copy:img'
  ]);

  grunt.registerTask('build:js', [
    'clean',
    'copy:js_pre',
    'uglify',
    'copy:js_minified',
    'concat:js',
    'copy:js',
  ]);

  grunt.registerTask('deploy', [
    'build',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:css', [
    'build:css',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:home', [
    'build:html',
    'merge_feeds:main',
    'sitemap',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:html', [
    'build:html',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:img', [
    'build:img',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:js', [
    'build:js',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:sitemap', [
    'sitemap',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('ping', [
    'pubsubhubbub_publish'
  ]);

  grunt.registerTask('publish:blog', [
    'gitcommit:add_entry',
    'build:blog',
    'gitcommit:update_cache',
    'gitcommit:publish_blog'
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:update_entry',
    'build:blog',
    'gitcommit:update_cache',
    'gitcommit:update_blog'
  ]);

  grunt.registerTask('upload', ['gitcommit:upload']);
};
