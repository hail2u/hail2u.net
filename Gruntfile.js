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
            'src/js/debug/show-column.js',
            'src/js/debug/toggle-class-permalink.js',
            'src/js/debug/toggle-class-has-image.js'
          ],
          '.grunt/tmp/main.js': [
            'src/js/bower_components/unutm/unutm.js',
            'src/js/async-csses/async-csses.js',
            'src/js/bower_components/google-code-prettify/src/prettify.js',
            'src/js/bower_components/google-code-prettify/src/lang-go.js',
            'src/js/bower_components/google-code-prettify/src/lang-yaml.js',
            'src/js/bower_components/google-code-prettify-language-handlers/*.js',
            'src/js/prettify/prettify-loader.js'
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
        src: 'src/css/test.html',
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
        sourcemap: 'none',
        unixNewlines: true,
        precision: 3,
        update: true
      },

      main: {
        options: {
          cacheLocation: 'src/css/.sass-cache/'
        },

        expand: true,
        cwd: 'src/css/',
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
        datadir: 'src/weblog/entries/',
        root: 'src/weblog/',
        static_dir: 'blog/'
      },

      article: {
        options: {
          reindex: true
        },

        file: grunt.option('file')
      },

      category: {
        file: (grunt.option('file') ? grunt.option('file').replace(/[^/]*$/, 'index.html') : grunt.option('file'))
      },

      feed: {
        file: 'index.rss'
      }
    },

    generate: {
      main: {
        expand: true,
        cwd: 'src/html/',
        src: [
          '**/*.mustache',
          '!shared/*',
          '!blog/theme.mustache'
        ],
        ext: '.html'
      },

      blog: {
        expand: true,
        cwd: 'src/html/',
        src: [
          'blog/index.mustache',
          'index.mustache'
        ],
        ext: '.html'
      },

      blog_theme: {
        expand: true,
        cwd: 'src/html/',
        src: ['blog/theme.mustache'],
        dest: 'src/weblog/entries/themes/html/',
        rename: function (dest, src) {
          return dest + 'page';
        }
      },

      home: {
        expand: true,
        cwd: 'src/html/',
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
          root: 'src/weblog/',
          submodule: true
        },

        file: grunt.option('file')
      },

      update: {
        options: {
          message: 'Update',
          root: 'src/weblog/',
          submodule: true
        },

        file: grunt.option('file')
      }
    },

    merge_feeds: {
      main: {
        options: {
          into: 'src/feed/index.rss',
          feeds: [
            './blog/feed'
          ],
          file: './feed'
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
    'merge_feeds',
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
