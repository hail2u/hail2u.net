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
          seperator: ';'
        },

        files: {
          'tmp/main.min.js': [
            'tmp/lightbox.min.js',
            'tmp/unutm.min.js'
          ]
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
      aco: {
        dest: 'build/styles/colorscheme.aco',
        src: ['src/css/colorscheme.aco']
      },

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
            dest: 'src/css/assets/scripts/unutm.js',
            src: ['node_modules/unutm/build/unutm.js']
          },
          {
            cwd: 'build/',
            dest: 'src/css/assets/',
            expand: true,
            src: [
              'apple-touch-icon.png',
              'images/favicon-16.png',
              'images/favicon-256.png',
              'images/favicon-32.png',
              'images/favicon-48.png'
            ]
          },
          {
            cwd: 'src/img/',
            dest: 'src/css/assets/images/',
            expand: true,
            src: [
              'about/how-i-markup-and-style-this-website.png',
              'icon/facebook.svg',
              'icon/feed.svg',
              'icon/tumblr.svg',
              'icon/twitter.svg',
              'logo.svg'
            ]
          },
          {
            cwd: 'src/js/',
            dest: 'src/css/assets/scripts/',
            expand: true,
            src: [
              'lightbox.js',
              'show-column.js',
              'show-outline.js',
              'toggle-tagline.js'
            ]
          },
          {
            cwd: 'src/woff/',
            dest: 'src/css/assets/fonts/',
            expand: true,
            src: [
              'megrim/*.woff',
              'source-code-pro/*.woff',
              'source-sans-pro/*.woff'
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

      cssPre: {
        options: {
          process: function (content) {
            return content.replace(/'assets\/(.*?)'/g, '\'../$1\'');
          }
        },

        cwd: 'src/css/',
        dest: 'tmp/',
        expand: true,
        ext: '.css',
        src: [
          'megrim.scss',
          'source-code-pro.scss',
          'source-sans-pro.scss'
        ]
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

      jsMinified: {
        files: {
          'tmp/unutm.js': 'node_modules//unutm/build/unutm.js',
          'tmp/unutm.min.js': 'node_modules//unutm/build/unutm.min.js',
          'tmp/unutm.min.js.map': 'node_modules//unutm/build/unutm.min.js.map'
        }
      },

      jsPre: {
        files: {
          'tmp/lightbox.js': 'src/js/lightbox.js',
          'tmp/show-column.js': 'src/js/show-column.js',
          'tmp/show-outline.js': 'src/js/show-outline.js',
          'tmp/toggle-tagline.js': 'src/js/toggle-tagline.js'
        }
      },

      styleGuide: {
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
              } else if (/^[\w-]+\.[\w^]+$/.test(url)) {
                url = '/styles/' + url;
              }

              return at + eq + oq + url + cq;
            });
          }
        },

        dest: 'build/about/style-guide/index.html',
        src: 'src/css/test.html'
      },

      woff: {
        cwd: 'src/woff/',
        dest: 'build/fonts/',
        expand: true,
        src: [
          'megrim/*.woff',
          'source-code-pro/*.woff',
          'source-sans-pro/*.woff'
        ]
      }
    },

    'css_mqpacker': {
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

    'pubsubhubbub_publish': {
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

    'single_charset': {
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

    svgRasterizer: {
      appleTouchIcon: {
        options: {
          width: 180
        },

        dest: 'build/apple-touch-icon.png',
        src: 'src/img/favicon.svg'
      },

      favicon1024: {
        options: {
          width: 1024
        },

        dest: 'build/images/favicon-1024.png',
        src: 'src/img/favicon.svg'
      },

      favicon16: {
        options: {
          width: 16
        },

        dest: 'build/images/favicon-16.png',
        src: 'src/img/favicon.svg'
      },

      favicon256: {
        options: {
          width: 256
        },

        dest: 'build/images/favicon-256.png',
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
      }
    },

    uglify: {
      options: {
        beautify: {
          'ascii_only': true
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
        imgdir: 'src/img/blog/',
        rootdir: 'src/weblog/',
        staticdir: 'build/blog/',
        staticimgdir: 'build/images/blog/'
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
      },

      preview: {
        options: {
          preview: true
        }
      }
    },

    feedmix: {
      options: {
        builder: {
          cdata: true,
          xmldec: {
            encoding: 'UTF-8',
            version: '1.0'
          }
        },
        parser: {
          trim: true
        }
      },

      main: {
        dest: 'build/feed',
        src: [
          'src/feed/index.rss',
          'build/blog/feed'
        ]
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
      assets: {
        options: {
          all: true,
          message: 'Update assets',
          root: 'src/css/'
        }
      },

      blogPublish: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Add',
          push: true,
          root: 'build/'
        }
      },

      blogUpdate: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Update',
          push: true,
          root: 'build/'
        }
      },

      cacheUpdate: {
        options: {
          message: 'Update cache files'
        },

        src: [
          '.grunt/cache/articles.json',
          'src/weblog/plugins/state/files_index.dat',
          'src/weblog/plugins/state/others_index.dat'
        ]
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

      entryAdd: {
        options: {
          message: 'Add'
        }
      },

      entryUpdate: {
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
    }
  });

  grunt.loadNpmTasks('css-mqpacker');
  grunt.loadNpmTasks('csswring');
  grunt.loadNpmTasks('feedmix');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-png2ico');
  grunt.loadNpmTasks('grunt-pubsubhubbub_publish');
  grunt.loadNpmTasks('grunt-svg-rasterizer');
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
    'feedmix',
    'sitemap'
  ]);

  grunt.registerTask('build:css', [
    'clean',
    'copy:cssPre',
    'sass',
    'css_mqpacker',
    'csswring',
    'concat:css',
    'single_charset',
    'copy:aco',
    'copy:css',
    'copy:styleGuide',
    'copy:woff'
  ]);

  grunt.registerTask('build:html', [
    'generate:main',
    'blosxom:index'
  ]);

  grunt.registerTask('build:img', [
    'svgmin',
    'svgRasterizer:appleTouchIcon',
    'svgRasterizer:favicon1024',
    'svgRasterizer:favicon16',
    'svgRasterizer:favicon256',
    'svgRasterizer:favicon32',
    'svgRasterizer:favicon48',
    'png2ico',
    'copy:img'
  ]);

  grunt.registerTask('build:js', [
    'clean',
    'copy:jsPre',
    'uglify',
    'copy:jsMinified',
    'concat:js',
    'copy:js'
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
    'feedmix',
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
    'gitcommit:entryAdd',
    'build:blog',
    'gitcommit:cacheUpdate',
    'gitcommit:blogPublish'
  ]);

  grunt.registerTask('update:assets', [
    'copy:assets',
    'gitcommit:assets'
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:entryUpdate',
    'build:blog',
    'gitcommit:cacheUpdate',
    'gitcommit:blogUpdate'
  ]);
};
