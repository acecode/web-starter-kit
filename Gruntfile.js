'use strict';
var path = require('path');
var fs   = require('fs');
var _    = require('lodash');
var chalk= require('chalk');
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

var webpackDistConfig = require('./webpack.dist.config.js'),
    webpackDevConfig = require('./webpack.config.js');

module.exports = function (grunt) {
  // Let *load-grunt-tasks* require everything
  require('load-grunt-tasks')(grunt);

  var saveJSON = function(file, obj){
    grunt.file.write(file, JSON.stringify(obj, null, 4));
  }

  // Read configuration from package.json
  var pkgConfig = grunt.file.readJSON('package.json');

  grunt.initConfig({
    host: '0.0.0.0',
    pkg: pkgConfig,

    chokidar: {
      go: {
        files: [
          'web/*.go',
          '*.go'
        ],
        tasks: [
          'shell:goBuild',
          'serve',
        ],
        options: {
          spawn: false,
          debounceDelay: 250,
          event: ['change', 'add']
        },
      },
      image: {
        files: [
          '<%= pkg.src %>/images/sprite/**',
          '<%= pkg.src %>/images/*/sprite*/*'
        ],
        tasks: [
          'spriteInit',
          'sprite'
        ],
        options: {
          spawn: false
        }
      },
      imageRev: {
        files: [
          '<%= pkg.src %>/images/**/*.{png,jpg,gif,jpeg}',
          '!<%= pkg.src %>/images/sprite/**',
          '!<%= pkg.src %>/images/**/sprite/**',
          '<%= pkg.src %>/images/sprite/*.{png,jpg,gif,jpeg}'
        ],
        tasks: [
          'filerev',
          'filerev.export'
        ]
      },
      assetsJSON: {
        files: [
          './webpack-main-assets.json',
          './filerev.json'
        ],
        tasks: [
          'assetsJSON'
        ],
        options: {
          spawn: false
        }
      }
    },

    webpack: {
      options: webpackDistConfig,
      dist: {
        cache: false
      }
    },

    'webpack-dev-server': {
      options: {
        hot: true,
        inline: true,
        host: '0.0.0.0',
        port: '<%= pkg.port.dev %>',
        webpack: webpackDevConfig,
        publicPath: '/assets/',
        contentBase: '<%= pkg.dist %>/',
        debug: true,
        proxy: [{
          // for all not hot-update request
          // path: new RegExp( '^(?!' + ".*\/assets" + ')(.*)$'),

          path:    /^(?!(\/sockjs-node|\/socket.io)|(.*\.hot-update\.js))(.*)$/,
          target: 'http://localhost:<%= pkg.port.backend %>'
        }],
        stats: {
          color: true,
          reason: true,
        },
        setup: function(app){
          grunt.log.writeln('webpack-dev-server setup');
          app.get('/grunttest', function(req,res,next){
            res.send('grunt TEST OK');
          })
        }
      },

      start: {
        keepAlive: false
      }
    },

    connect: {
      options: {
        port: 8000
      },

      dist: {
        options: {
          keepalive: true,
          middleware: function (connect) {
            return [
              mountFolder(connect, pkgConfig.dist)
            ];
          }
        }
      }
    },

    open: {
      options: {
        delay: 5000
      },
      dev: {
        path: 'http://localhost:<%= pkg.port.backend %>'
      },
      dist: {
        path: 'http://localhost:<%= pkg.port.backend %>/'
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },

    copy: {
      dist: {
        files: [
          // includes files within path
          {
            flatten: true,
            expand: true,
            src: ['<%= pkg.src %>/*'],
            dest: '<%= pkg.dist %>/',
            filter: 'isFile'
          },
          {
            flatten: true,
            expand: true,
            src: ['<%= pkg.src %>/images/*'],
            dest: '<%= pkg.dist %>/images/'
          }
        ]
      }
    },

    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= pkg.dist %>'
          ]
        }]
      }
    },

    // minify the images
    tinypng: {
      options: {
        // TODO maybe We should add lot of apiKey and random use one;
        apiKey: 'a5le0J1RmIKbTt-wZ2pCVkdjq2GZupt_',
        checkSigs: true,
        // recommend to save this file in SCM(git/svn)
        //   for quickly minify on everywhere

        // TODO thinking about it in production
        sigFile: 'tinypng_sigs.json',

        summarize: true,
        showProgress: true,
      },

      image: {
        files: [{
          expand: true,
          cwd: '<%= pkg.src %>/images/',
          // minify the images + sprite output images
          // not the origin sprites
          // TODO imagemin gif
          src: [
            '**/*.{png,jpg,jpeg}',
            '!sprite/**',
            '!**/sprite/**',
            'sprite/*.{png,jpg,jpeg}'
          ],
          dest: '<%= pkg.src %>/images/'
        }],
        // Target-specific file lists and/or options go here.
      },
    },

    // filled by spriteInit Task;
    sprite: {},

  });

  //load tasks files
  grunt.loadTasks('./tasks')

  grunt.registerTask('serve', function (target) {

    if (target === 'dist') {
      return grunt.task.run([
        'build',
        'webpack',
        'open:dist',
        'connect:dist']);
    }

    grunt.task.run([
      'build',
      'server',
      'entry',
      'webpack-dev-server',
      'open:dev',
      'chokidar'
    ]);
  });


  grunt.registerTask('test', ['karma']);

  grunt.registerTask('build', [
    'clean',
    'spriteInit', 'sprite',
    // 'tinypng',
    'filerev', 'filerev.export', 'assetsJSON',
    'shell:goBuild'
  ]);

  // grunt.registerTask('build-go', ['shell:goBuild'])
  grunt.registerTask('default', []);
};
