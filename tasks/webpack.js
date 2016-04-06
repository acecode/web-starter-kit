var path = require('path');
var chalk = require('chalk');
module.exports=function(grunt){
  var webpackDistConfig = require('../webpack.dist.config.js'),
      webpackDevConfig = require('../webpack.config.js');
  grunt.config.merge({
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
    }
  })
  // set up webpack's entry property for file
  //  `entry/*.js`

  grunt.registerTask('entry', 'set webpack options entries', function(){
    var files = grunt.file.expand({}, ['./src/javascripts/*.js']);
    var entryMap = {};
    var entryDevMap = {};
    files.forEach(function(file){
      var name = path.basename(file, '.js')
      var entry = ['.', path.relative('./src', file)].join(path.sep);
      entryMap[name] = entry;
      entryDevMap[name] = [
        'webpack/hot/only-dev-server',
        entry
      ];

      grunt.verbose.writeln('entry set ', chalk.red(name), '=>', chalk.yellow(entryMap[name]));

    })

    grunt.config.set('webpack.options.entry', entryMap);
    grunt.config.set('webpack-dev-server.options.webpack.entry', entryDevMap);
  })
}
