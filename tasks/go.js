/**
 * go Server related Task
 * base plugin `grunt-shell-spawn`
 *
 */
'use strict';
var chalk = require('chalk');

module.exports = function(grunt){

  var CONFIG ={
    BUILD_OK: 'goBuild.ok'
  }

  grunt.config.merge({

    // build and (re)start the server
    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true
      },

      //build go APP

      goBuild: {
        command: 'go build -race -o <%= pkg.name %>-<%= pkg.version %>',
        options: {
          canKill: true,
          async: false,
          callback: function(exitCode, stdOutStr, stdErrStr, done) {
            if (exitCode == 0) {
              grunt.config.set(CONFIG.BUILD_OK, true);
            } else {
              grunt.config.set(CONFIG.BUILD_OK, false);
              grunt.event.emit('goBuildError', stdOutStr, stdErrStr);
            }
            done();
          }
        }
      },

      // start up the server;

      goServer: {
        //TODO use different command for dev and build
        command: [
          './<%= pkg.name %>-<%= pkg.version %>',
            '--debug',
            '--web=:<%= pkg.port.backend %>',
            '--devWeb=:<%= pkg.port.dev %>'
          ].join(' '),
        //     command: './<%= app.name %> --debug --web=:<%= app.port.backend %>',
        options: {
          canKill: true,
          async: true,
          stopIfStarted: true
        }
      }
    },
  });

  //
  grunt.registerTask('server',
    'check the build status, then serve the go Server',
  function() {
    var buildOK = grunt.config.get(CONFIG.BUILD_OK);
    grunt.log.ok('go Server buildOK ', buildOK);
    if (buildOK) {
      grunt.log.ok('server start');
      grunt.task.run(['shell:goServer']);
      grunt.config.set('goServer.running', true);
    } else {
      if(grunt.config.get('goServer.running')){
        grunt.log.error(chalk.red('build Failed\n'), chalk.yellow('\tCheck you code please!'));
      }else{
        grunt.fail.fatal('BUILD FAIL\n' + chalk.yellow('Check you go code and runtime!'));
      }
    }
  });
}
