'use strict';

module.exports = function (grunt) {
  grunt.util.linefeed = '\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      css: {
        src: [
          '.grunt/tmp/**/*.css',
          '.grunt/tmp/**/*.css.map'
        ]
      },

      js: {
        src: [
          '.grunt/tmp/**/*.js',
          '.grunt/tmp/**/*.js.map'
        ]
      }
    },

    concat: {
      js: {
        options: {
          seperator: ';',
          sourceMap: true,
          sourceMapStyle: 'link'
        },

        files: {
          '.grunt/tmp/debug.min.js': ['.grunt/tmp/show-column.min.js'],
          '.grunt/tmp/main.min.js': [
            '.grunt/tmp/unutm.min.js',
            '.grunt/tmp/async-csses.min.js'
          ],
          '.grunt/tmp/search.min.js': ['.grunt/tmp/popular-pages.min.js']
        }
      }
    },

    connect: {
      main: {
        options: {
          base: 'build/',
          hostname: '127.0.0.1',
          keepalive: true,
          open: true,
          port: 0
        }
      }
    },

    copy: {
      css: {
        cwd: '.grunt/tmp/',
        dest: 'build/styles/',
        expand: true,
        src: [
          '*.css',
          '*.css.map'
        ]
      },

      favicon: {
        files: {
          'build/images/favicon.svg': 'build/images/logo.min.svg'
        }
      },

      js: {
        cwd: '.grunt/tmp/',
        dest: 'build/scripts/',
        expand: true,
        src: [
          '**/*.js',
          '**/*.js.map'
        ]
      },

      prejs: {
        files: {
          '.grunt/tmp/async-csses.js': 'src/js/async-csses.js',
          '.grunt/tmp/popular-pages.js': 'src/js/popular-pages.js',
          '.grunt/tmp/show-column.js': 'src/js/debug/show-column.js',
          '.grunt/tmp/unutm.js': 'src/js/bower_components/unutm/build/unutm.js',
          '.grunt/tmp/unutm.min.js': 'src/js/bower_components/unutm/build/unutm.min.js',
          '.grunt/tmp/unutm.min.js.map': 'src/js/bower_components/unutm/build/unutm.min.js.map'
        }
      },

      style_guide: {
        options: {
          process: function (content, srcpath) {
            [
              {
                pattern: /((href|src)=")http:\/\/hail2u\.net\//g,
                replace: '$1/'
              },
              {
                pattern: /((href|src)=")\.\.\/\.\.\/build\//g,
                replace: '$1/'
              },
              {
                pattern: /((href|src)=")\.\//g,
                replace: '$1/styles/'
              },
            ].forEach(function (sub) {
              content = content.replace(sub.pattern, sub.replace);
            });

            return content;
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
        cwd: '.grunt/tmp/',
        dest: '.grunt/tmp/',
        expand: true,
        ext: '.min.css',
        src: [
          '**/*.css',
          '!**/*.min.css'
        ]
      }
    },

    csswring: {
      options: {
        map: {
          inline: false,
          sourcesContent: false
        }
      },

      main: {
        cwd: '.grunt/tmp/',
        dest: '.grunt/tmp/',
        expand: true,
        src: ['**/*.min.css'],
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
        dest: '.grunt/tmp/',
        expand: true,
        ext: '.css',
        src: ['*.scss']
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
        cwd: '.grunt/tmp/',
        dest: '.grunt/tmp/',
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
        root: 'src/weblog/',
        static_dir: 'build/blog/'
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
        src: [
          '**/*.mustache',
          '!partial/*',
          '!blog/theme.mustache'
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
      },

      blog_theme: {
        cwd: 'src/html/',
        dest: 'src/weblog/entries/themes/html/',
        expand: true,
        rename: function (dest, src) {
          return dest + 'page';
        },
        src: ['blog/theme.mustache']
      },

      home: {
        cwd: 'src/html/',
        dest: 'build/',
        expand: true,
        ext: '.html',
        src: ['index.mustache']
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
          message: 'Deploy',
          push: true,
          root: 'build/'
        }
      },

      publish_blog: {
        options: {
          all: true,
          branch: 'gh-pages',
          message: 'Publish',
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

      update_blog_theme: {
        options: {
          message: 'Update weblog theme'
        },

        src: ['src/weblog/entries/themes/html/page']
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
          message: 'Upload',
          push: true,
          root: 'build/'
        }
      }
    },

    svg2png: {
      apple_touch_icon: {
        options: {
          width: 180
        },

        dest: 'build/apple-touch-icon.png',
        src: 'build/images/favicon.svg'
      },

      favicon16: {
        options: {
          width: 16
        },

        dest: 'build/images/favicon-16.png',
        src: 'build/images/favicon.svg'
      },

      favicon32: {
        options: {
          width: 32
        },

        dest: 'build/images/favicon-32.png',
        src: 'build/images/favicon.svg'
      },

      favicon48: {
        options: {
          width: 48
        },

        dest: 'build/images/favicon-48.png',
        src: 'build/images/favicon.svg'
      },

      favicon64: {
        options: {
          width: 64
        },

        dest: 'build/images/favicon-64.png',
        src: 'build/images/favicon.svg'
      },

      favicon256: {
        options: {
          width: 256
        },

        dest: 'build/images/favicon-256.png',
        src: 'build/images/favicon.svg'
      },

      favicon1024: {
        options: {
          width: 1024
        },

        dest: 'build/images/favicon-1024.png',
        src: 'build/images/favicon.svg'
      }
    }
  });

  for (var devDependency in grunt.config.data.pkg.devDependencies) {
    if (
      devDependency.indexOf('grunt-') === 0 &&
      devDependency !== 'grunt-cli'
    ) {
      grunt.loadNpmTasks(devDependency);
    }
  }

  grunt.loadTasks('.grunt/task/');

  grunt.registerTask('deploy', [
    'build',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:css', [
    'build:css',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:favicon', [
    'build:favicon',
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

  grunt.registerTask('build', [
    'build:css',
    'build:favicon',
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
    'clean:css',
    'sass',
    'css_mqpacker',
    'csswring',
    'copy:css',
    'copy:style_guide',
  ]);

  grunt.registerTask('build:favicon', [
    'copy:favicon',
    'svg2png:apple_touch_icon',
    'svg2png:favicon16',
    'svg2png:favicon32',
    'svg2png:favicon48',
    'svg2png:favicon64',
    'svg2png:favicon256',
    'svg2png:favicon1024'
  ]);

  grunt.registerTask('build:html', [
    'generate:main',
    'generate:blog_theme',
    'gitcommit:blog_theme',
    'blosxom:index'
  ]);

  grunt.registerTask('build:js', [
    'clean:js',
    'copy:prejs',
    'uglify',
    'concat:js',
    'copy:js',
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:update_entry',
    'build:blog',
    'gitcommit:update_blog'
  ]);

  grunt.registerTask('upload', ['gitcommit:upload']);
};
