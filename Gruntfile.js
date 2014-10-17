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
            'src/js/debug/toggle-tagline.js'
          ],
          '.grunt/tmp/main.js': [
            'src/js/bower_components/unutm/unutm.js',
            'src/js/async-csses.js'
          ],
          '.grunt/tmp/search.js': [
            'src/js/popular-pages.js'
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
        dest: 'build/styles/'
      },

      js: {
        expand: true,
        cwd: '.grunt/tmp/',
        src: [
          '**/*.js',
          '**/*.js.map'
        ],
        dest: 'build/scripts/'
      },

      style_guide: {
        options: {
          process: function (content, srcpath) {
            return content.replace(/((href|src)=")(\.\.\/\.\.\/build\/|http:\/\/hail2u\.net\/)/g, '$1/');
          }
        },

        src: 'src/css/test.html',
        dest: 'build/about/style-guide/index.html'
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
        static_dir: 'build/blog/'
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
        dest: 'build/',
        ext: '.html'
      },

      blog: {
        expand: true,
        cwd: 'src/html/',
        src: [
          'blog/index.mustache',
          'index.mustache'
        ],
        dest: 'build/',
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
        dest: 'build/',
        ext: '.html'
      }
    },

    generate_sitemap: {
      main: {
        file: 'build/sitemap.xml'
      }
    },

    gitcommit: {
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
          message: 'Publish'
        }
      },

      update_blog: {
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

    merge_feeds: {
      main: {
        options: {
          into: 'src/feed/index.rss',
          feeds: [
            'build/blog/feed'
          ],
          file: 'build/feed'
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

  grunt.registerTask('upload', [
    'gitcommit:upload'
  ]);

  grunt.registerTask('deploy', [
    'rebuild',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:blog', [
    'blosxom:article',
    'blosxom:category',
    'blosxom:feed',
    'generate:blog',
    'merge_feeds',
    'rebuild:sitemap',
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
    'rebuild:sitemap',
    'gitcommit:deploy',
    'pubsubhubbub_publish:main'
  ]);

  grunt.registerTask('deploy:html', [
    'rebuild:html',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('deploy:sitemap', [
    'rebuild:sitemap',
    'gitcommit:deploy'
  ]);

  grunt.registerTask('publish:blog', [
    'gitcommit:publish_blog',
    'deploy:blog',
    'pubsubhubbub_publish:main'
  ]);

  grunt.registerTask('update:blog', [
    'gitcommit:update_blog',
    'deploy:blog'
  ]);

  grunt.registerTask('default', ['connect']);
};
