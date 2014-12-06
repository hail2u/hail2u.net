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
      options: {
        seperator: ';'
      },

      js: {
        files: {
          '.grunt/tmp/debug.js': [
            'src/js/debug/show-column.js'
          ],
          '.grunt/tmp/main.js': [
            'src/js/bower_components/unutm/unutm.js',
            'src/js/async-csses.js'
          ],
          '.grunt/tmp/search.js': ['src/js/popular-pages.js']
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

      js: {
        cwd: '.grunt/tmp/',
        dest: 'build/scripts/',
        expand: true,
        src: [
          '**/*.js',
          '**/*.js.map'
        ]
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

        preserveComments: false,
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
    'rebuild',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:css', [
    'rebuild:css',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:js', [
    'rebuild:js',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:home', [
    'rebuild:html',
    'merge_feeds:main',
    'sitemap',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:html', [
    'rebuild:html',
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
    'rebuild:blog',
    'gitcommit:publish_blog'
  ]);

  grunt.registerTask('rebuild', [
    'rebuild:css',
    'rebuild:js',
    'rebuild:html',
    'sitemap'
  ]);

  grunt.registerTask('rebuild:blog', [
    'blosxom:article',
    'generate:blog',
    'merge_feeds',
    'sitemap'
  ]);

  grunt.registerTask('rebuild:css', [
    'clean:css',
    'sass',
    'css_mqpacker',
    'csswring',
    'copy:css',
    'copy:style_guide',
  ]);

  grunt.registerTask('rebuild:js', [
    'clean:js',
    'concat:js',
    'uglify',
    'copy:js',
  ]);

  grunt.registerTask('rebuild:html', [
    'generate:main',
    'generate:blog_theme',
    'blosxom:index'
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:update_entry',
    'rebuild:blog',
    'gitcommit:update_blog'
  ]);

  grunt.registerTask('upload', [
    'gitcommit:upload'
  ]);
};
