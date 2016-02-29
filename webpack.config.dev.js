//merge hot reload config
var webpack = require('webpack');
var config = require('./webpack.config.js');

var devServer = {
    hot: true,
    inline: true,
    debug: true,
    progress: true,
    port: process.env.DEV_HOT_PORT || 8090,
    // proxy: [{
    //   // for all not hot-update request
    //   path:    /^(?!.*\.hot-update\.js)(.*)$/,
    //   target: 'http://localhost:' + process.env.PORT || 9000
    // }],
    // contentBase:'http://localhost:9000',
    devtool: 'eval-source-map',
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    },
    open: true,
    stats: { colors: true }
  };

  config.plugins.unshift(new webpack.HotModuleReplacementPlugin());

  var babelLoader = config.module.loaders.filter(function(loader){
    return loader.loader === 'babel' ||  loader.loader === 'babel-loader'
  })[0];
  babelLoader.query.presets.unshift('react-hmre');
  babelLoader.query.plugins = babelLoader.query.plugins || [];
  babelLoader.query.plugins.push([
    'react-transform', {
      transforms: [{
        transform : 'react-transform-hmr',
        imports   : ['react'],
        locals    : ['module']
      }]
    }
  ]);
  config.output.publicPath = "http://localhost:" + devServer.port + config.output.publicPath
config.devServer = devServer
module.exports = config;
