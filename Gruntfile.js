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
          path:    /^(?!(\/sockjs-node|\/socket.io)|(.*\.hot-update\.js))(.*)$/,
          target: 'http://localhost:<%= pkg.port.backend %>'
        }],
        stats: {
          color: true,
          reason: true,
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
        delay: 500
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

    // build and (re)start the server
    shell: {
      options: {
        stdout: true,
        stderr: true,
        failOnError: true
      },

      //

      goBuild: {
        command: 'go build -race -o <%= pkg.name %>-<%= pkg.version %>',
        options: {
          canKill: true,
          async: false,
          callback: function(exitCode, stdOutStr, stdErrStr, done) {
            if (exitCode == 0) {
              grunt.config.set('goBuild.ok', true);
            } else {
              grunt.config.set('goBuild.ok', false);
              grunt.event.emit('gobuildError', stdOutStr, stdErrStr);
            }
            done();
          }
        }
      },

      // start up the server;

      goServer: {
        //TODO use different command for dev and build
        command: './<%= pkg.name %>-<%= pkg.version %> --debug --web=:<%= pkg.port.backend %> --devWeb=:<%= pkg.port.dev %>',
        
        //     command: './<%= app.name %> --debug --web=:<%= app.port.backend %>',
        options: {
          canKill: true,
          async: true,
          stopIfStarted: true
        }
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
    
    // rev the file
    // mainly for the images

    filerev: {
      options: {
        length: 6,
        // change default abc.xxxxxx.js to abc-xxxxxx.js
        process: function(basename, name, extension){
          console.log(basename, name, extension);
          return basename + '-' +name+'.'+extension;
        }
      },

      image: {
        files: [{
          expand: true,
          cwd: '<%= pkg.src %>/images/',
          src: [
            '**/*.{png,jpg,gif,jpeg}',
            '!sprite/**',
            '!**/sprite/**',
            'sprite/*.{png,jpg,gif,jpeg}'
          ],
          dest: '<%= pkg.dist %>/images/'
        }]
      }
    },
  });
   // initSprite settings from file

  grunt.registerTask('spriteInit', 'set up sprites', function() {
    
    // make target config for each dir
    function getTargetConf(target, dir) {
      var obj = {};
      obj[target] = {
        src: dir + '/*.png',
        dest: '<%= pkg.src %>/images/sprite/' + target + '.png',
        destCss: '<%= pkg.src %>/stylesheets/sprite/' + target +
          '.styl',
        cssSpritesheetName: target,
        imgPath: '../images/sprite/' + target + '.png',
        cssVarMap: function(sprite) {
          sprite.name = target + '_' + sprite.name;
        }
      }
      return obj;
    }

    // find the dirs
    //    which is not empty
    var list = grunt.file.expand({},
      [
        grunt.template.process('<%= pkg.src%>/images/sprite/*'),
        grunt.template.process('<%= pkg.src%>/images/*/sprite{*,}/')
      ]
    );

    //make up config object
    list = list.filter(function(src){
      grunt.verbose.writeln('[filter]', src);
      if(!grunt.file.isDir(src)){
        grunt.verbose.warn(src, 'is not a dir');
        return false;
      }else if(fs.readdirSync(src).length === 0){
        grunt.verbose.warn(src, 'is an empty dir');
        return false;
      }else {
        grunt.verbose.ok(src, 'is good sprite Dir');
        return true;
      }
    });
    grunt.verbose.ok('list', list);
    
    list.forEach(function(dir) {
      
      var name = path.basename(dir);
      
      // for these *project use sprite* 'images/project-a/sprite' 
      //    the name is in middle
      if( name.indexOf('sprite')=== 0 ){
        var subName = name.replace(/^sprite-?/, '');
        if( subName === ''){
          name = path.basename(path.dirname(dir))
        }else{
          name = path.basename(path.dirname(dir)) + '-' + subName;
        }
      }
       
      var baseConfig = getTargetConf(name, dir);
      var config = {};
      var configPath = path.join(dir, 'config.json');
      
      // U can add config in the sprite DIR,
      //    `config.json` which will overwrite the other config

      if (grunt.file.exists(configPath)) {
        config[name] = require('.' + path.sep + configPath)
      }
      
      baseConfig = _.merge({
        x: baseConfig
      }, {
        x: config
      }).x;
      
      grunt.verbose.ok(dir + ' config\n')
      
      // save all the config
      grunt.config.merge({
        sprite: baseConfig
      });
    })

  });

  // set up webpack's entry property for file 
  //  `entry/*.js`

  grunt.registerTask('entry', 'find the entrys ', function() {
    var done = this.async();
    var entry = grunt.file.expand({
      cwd: './src'
    }, ['./entry/*.js']);
    
    var entryMap = {};
    var entryDevMap = {};
    entry.forEach(function(entry) {
      var name = path.basename(entry, '.js')
      entryMap[name] = ['./src', entry].join(path.sep);
      entryDevMap[name] = [
        'webpack/hot/only-dev-server',
        entry
      ]
      grunt.verbose.writeln('entry set ', chalk.red(name), '=>', chalk.yellow(entryMap[name]));
    })
    
    grunt.config.set('webpack.options.entry', entryMap);
    grunt.config.set('webpack-dev-server.options.webpack.entry', entryDevMap);

    done();
  });

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
      'open:dev',
      'server',
      'entry',
      't',
      'webpack-dev-server',
      'chokidar'
    ]);
  });

  grunt.registerTask('server',
    'check the build status, then serve the go Server',
  function() {
    var buildOK = grunt.config.get('goBuild.ok');
    grunt.log.ok('go Server buildOK ', buildOK);
    if (buildOK) {
      grunt.log.ok('server start');
      grunt.task.run(['shell:goServer']);
      grunt.config.set('goServer.running', true);
    } else {
      grunt.log.error('build Failed, do nothing')
    }
  });
  
  grunt.registerTask('filerev.export',
    'export filerev summary to file',
    function(){
      saveJSON('./filerev.json', grunt.filerev.summary);
  })

  grunt.registerTask('assetsJSON',
      'merge webpack assets + filerev assets',
    function() {
      var map = _.clone(grunt.filerev.summary) || {};
      var webpackAsssets = grunt.file.readJSON('./webpack-main-assets.json');
      map = _.chain(map)
        .mapKeys(function(v, k){ return k.replace(/^src\//,'')})
        .mapValues(function(v){ return v.replace(/^dist\//,'')})
        .merge(webpackAsssets)
        .value();
      grunt.file.write('./webpack-assets.json', JSON.stringify(map, null, 4))
    });

  grunt.registerTask('t',
  'merge webpack assets + filerev assets',
  function() {
    console.log('webpack.options', grunt.config.get('webpack.options.entry'))
    console.log('webpack-dev.options', grunt.config.get('webpack-dev-server.options.entry'))

    saveJSON('./webpack.options.json', grunt.config.getRaw('webpack.options'));
    saveJSON('./webpack-dev-server.options.json', grunt.config.getRaw('webpack-dev-server.options'));
  });

  grunt.registerTask('test', ['karma']);

  grunt.registerTask('build', [
    'clean',
    'spriteInit', 'sprite', 
    'tinypng',
    'filerev', 'filerev.export', 'assetsJSON',
    'shell:goBuild'
  ]);

  // grunt.registerTask('build-go', ['shell:goBuild'])
  grunt.registerTask('default', []);
};
