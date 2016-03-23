'use strict';
var path = require('path');
var fs   = require('fs');
var _    = require('lodash');
var chalk= require('chalk');
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};



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

    // copy: {
    //   dist: {
    //     files: [
    //       // includes files within path
    //       {
    //         flatten: true,
    //         expand: true,
    //         src: ['<%= pkg.src %>/*'],
    //         dest: '<%= pkg.dist %>/',
    //         filter: 'isFile'
    //       },
    //       {
    //         flatten: true,
    //         expand: true,
    //         src: ['<%= pkg.src %>/images/*'],
    //         dest: '<%= pkg.dist %>/images/'
    //       }
    //     ]
    //   }
    // },

    clean: {
      dist: {
        files: [{
          src: [
            '<%= pkg.dist %>'
          ]
        }]
      }
    },

  });

  //load tasks files
  grunt.loadTasks('./tasks')

  grunt.registerTask('serve', function (target) {

    if (target === 'dist') {
      return grunt.task.run([
        'build',
        'webpack',
        'open:dist']);
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
