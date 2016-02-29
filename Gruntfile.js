'use strict';
var spawn = require('child_process').spawn;
var _ = require('lodash');
var path = require('path');
module.exports = (grunt) => {
    require('time-grunt')(grunt)
    require('load-grunt-tasks')(grunt)

    //config the webpack.config.js
    process.env.DEV_HOT = 1;
    process.env.DEV_HOT_PORT = grunt.option('devWeb') || 8090;
    process.env.PORT = grunt.option('web') || 9000;

    var webpackConf = require('./webpack.config.js');
    var devConf = require('./webpack.config.dev.js');
    var devServer = devConf.devServer;
    delete devConf.devServer;
    devServer.stats= {
       // Configure the console output
       colors: true,
       chunks: true,
    };

    grunt.initConfig({
      app:{
        name: path.basename(process.cwd()),
        web: process.env.PORT,
        devWeb: process.env.DEV_HOT_PORT
      },
      kill: {

      },

      webpack: {
        build: webpackConf
      },

      "webpack-dev-server": {
        options: {
          webpack: devConf,
          inline: true,
          hot: true,
          stats: {
            color: true,
            chunkModules: true,
            hash: true,
          },
          port:'<%= app.devWeb %>',
          publicPath: devConf.output.publicPath
        },
        start: {
          options: devServer
        }
      },

      /**
        监听文件变化
       */
      chokidar: {
        go: {
          files:[
            'web/*.go',
            '*.go'
          ],
          tasks: [
            'shell:goBuild',
            'goServer',
          ],
          options: {
            spawn: false,
            interrupt: true,
            debounceDelay: 250,
            event: ['change', 'add']
          },
        },

      },
      /**

       */
       shell: {
         options: {
           stdout: true,
           stderr: true,
           failOnError: true
         },
         goBuild: {
           command: 'go build -race -o <%= app.name %>',
           options: {
             canKill: true,
             async: false,
             callback: function(exitCode, stdOutStr, stdErrStr, done) {
                grunt.log.writeln(this.pid, exitCode, exitCode == 0)
                grunt.config.set('goBuild.ok', exitCode ==0);
                done();
             }
           }
         },
         goServer: {
           command: './<%= app.name %> --debug --web=:<%= app.web %> --devweb=:<%= app.devWeb %>',
           options: {
             canKill: true,
             async: true,
             stopIfStarted: true
           }
         }
       }
    })

    grunt.registerTask('default', function(){
        grunt.log.ok('default Task');
        grunt.task.run([
          'shell:goBuild',
          // 'webpack',
          'webpack-dev-server:start',
          'goServer',
          'chokidar:go'
        ])
    });

    grunt.registerTask('goServer', function(){
        var buildOK = grunt.config.get('goBuild.ok');
        grunt.log.ok('go Server buildOK ', buildOK);
        if(buildOK){
          // if(grunt.config.get('goServer.running')){
          //   grunt.log.ok('kill running server');
          //   grunt.task.run([
          //   'shell:goServer:kill',
          //   ])
          // }
          grunt.log.ok('server start');
          grunt.task.run(['shell:goServer']);
          grunt.config.set('goServer.running', true);
        }else{
          grunt.log.error('build Failed, do nothing')
        }

    });

    grunt.registerTask('test',  function(){
      grunt.config.set('webpack-dev-server.options.keepalive', true);
      grunt.log.writeln('',grunt.config.get('webpack-dev-server.options'));
      grunt.task.run([
        'webpack-dev-server:start',
        'webpackState',
      ]);
    });

    grunt.registerTask('webpackState', function(){
      grunt.log.writeln("webpack State", grunt.config.get('xyz'));
    })

    grunt.event.on('chokidar', function(action, filepath, target) {
      grunt.log.ok('chokidar change', action, filepath, target);
    });
};
