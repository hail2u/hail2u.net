/* jshint node: true */
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
        'src': [
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
            '.grunt/js/debug/show-column.js',
            '.grunt/js/debug/toggle-class-permalink.js',
            '.grunt/js/debug/version.js'
          ],
          '.grunt/tmp/html5shiv.js': ['.grunt/js/bower_components/html5shiv/dist/html5shiv.js'],
          '.grunt/tmp/main.js': [
            '.grunt/js/bower_components/unutm/unutm.js',
            '.grunt/js/async-print-css/async-print-css.js',
            '.grunt/js/bower_components/google-code-prettify/src/prettify.js',
            '.grunt/js/bower_components/google-code-prettify/src/lang-go.js',
            '.grunt/js/bower_components/google-code-prettify/src/lang-yaml.js',
            '.grunt/js/bower_components/google-code-prettify-language-handlers/*.js',
            '.grunt/js/prettify/prettify-loader.js'
          ]
        }
      }
    },

    connect: {
      main: {
        options: {
          port: 0,
          hostname: '127.0.0.1',
          keepalive: true,
          open: true
        }
      }
    },

    copy: {
      css: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '*.css',
          '*.css.map'
        ],
        dest: 'styles/'
      },

      js: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '**/*.js',
          '**/*.js.map'
        ],
        dest: 'scripts/'
      },

      style_guide: {
        src: '.grunt/css/test.html',
        dest: 'about/style-guide/index.html'
      }
    },

    css_mqpacker: {
      options: {
        map: true
      },

      main: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '**/*.css',
          '!**/*.min.css'
        ],
        dest: '.grunt/tmp/',
        ext: '.min.css'
      }
    },

    csswring: {
      options: {
        map: true
      },

      main: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '**/*.min.css'
        ],
        dest: '.grunt/tmp/'
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

    rsync: {
      options: {
        remote: 'hail2u@s44.xrea.com:~/public_html/hail2u.net/'
      },

      main: {
        options: {
          dry_run: false,
          sync: true
        }
      }
    },

    sass: {
      options: {
        unixNewlines: true,
        precision: 3,
        sourcemap: 'none'
      },

      main: {
        options: {
          cacheLocation: '.grunt/css/.sass-cache/'
        },

        expand: true,
        cwd: '.grunt/css/',
        src: ['*.scss'],
        dest: '.grunt/tmp/',
        ext: '.css'
      }
    },

    uglify: {
      options: {
        beautify: {
          ascii_only: true
        },

        sourceMap: true,
        preserveComments: false
      },

      main: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '**/*.js',
          '!**/*.min.js'
        ],
        dest: '.grunt/tmp/',
        ext: '.min.js'
      }
    },

    blosxom: {
      options: {
        datadir: '.grunt/weblog/entries/',
        root: '.grunt/weblog/',
        static_dir: 'blog/'
      },

      article: {
        options: {
          reindex: true
        },

        file: grunt.option('file')
      },

      category: {
        file: grunt.option('file')
      },

      feed: {
        file: 'index.rss'
      }
    },

    generate: {
      main: {
        expand: true,
        cwd: '.grunt/html/',
        src: [
          '**/*.mustache',
          '!shared/*',
          '!blog/theme.mustache'
        ],
        ext: '.html'
      },

      blog: {
        expand: true,
        cwd: '.grunt/html/',
        src: [
          'blog/index.mustache',
          'index.mustache'
        ],
        ext: '.html'
      },

      blog_theme: {
        expand: true,
        cwd: '.grunt/html/',
        src: ['blog/theme.mustache'],
        dest: '.grunt/weblog/entries/themes/html/',
        rename: function (dest, src) {
          return dest + 'page';
        }
      },

      home: {
        expand: true,
        cwd: '.grunt/html/',
        src: ['index.mustache'],
        ext: '.html'
      }
    },

    generate_sitemap: {
      main: {
        file: 'sitemap.xml'
      }
    },

    gitcommit: {
      options: {
        push: true
      },

      publish: {
        options: {
          message: 'Publish',
          root: '.grunt/weblog/',
          submodule: true
        },

        file: grunt.option('file')
      },

      update: {
        options: {
          message: 'Update',
          root: '.grunt/weblog/',
          submodule: true
        },

        file: grunt.option('file')
      }
    },

    merge_feeds: {
      main: {
        options: {
          file: './feed',
          into: './index.rss',
          feeds: [
            './blog/feed'
          ]
        }
      }
    }
  });

  for (var devDependency in grunt.config.data.pkg.devDependencies) {
    if (devDependency.match(/^grunt-/)) {
      grunt.loadNpmTasks(devDependency);
    }
  }

  grunt.loadTasks('.grunt/task/');

  grunt.registerTask('rebuild', [
    'rebuild:css',
    'rebuild:js',
    'rebuild:html',
    'rebuild:sitemap'
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
    'generate:blog_theme'
  ]);

  grunt.registerTask('rebuild:sitemap', [
    'generate_sitemap'
  ]);

  grunt.registerTask('deploy', [
    'rebuild',
    'rsync'
  ]);

  grunt.registerTask('deploy:css', [
    'rebuild:css',
    'rsync'
  ]);

  grunt.registerTask('deploy:js', [
    'rebuild:js',
    'rsync'
  ]);

  grunt.registerTask('deploy:html', [
    'rebuild:html',
    'rsync'
  ]);

  grunt.registerTask('deploy:sitemap', [
    'rebuild:sitemap',
    'rsync'
  ]);

  grunt.registerTask('publish:home', [
    'merge_feeds:main',
    'generate:home',
    'rebuild:sitemap',
    'rsync',
    'pubsubhubbub_publish:main'
  ]);

  grunt.registerTask('publish:blog', [
    'gitcommit:publish',
    'blosxom:article',
    'blosxom:category',
    'blosxom:feed',
    'generate:blog',
    'merge_feeds:main',
    'rebuild:sitemap',
    'rsync',
    'pubsubhubbub_publish'
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:update',
    'blosxom:article',
    'blosxom:category',
    'blosxom:feed',
    'generate:blog',
    'merge_feeds:main',
    'rsync'
  ]);

  grunt.registerTask('default', ['connect']);
};
