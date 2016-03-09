/*
 * Webpack development server configuration
 *
 * This file is set up for serving the webpack-dev-server, which will watch for changes and recompile as required if
 * the subfolder /webpack-dev-server/ is visited. Visiting the root will not automatically reload.
 */
'use strict';
var path = require('path');
var webpack = require('webpack');
var assetsExportPlugin = require('./AssetsExportPlugin');
var pkg     = require('./package.json');
var ExtractPlugin = require('extract-text-webpack-plugin');
var srcPath = ['.', pkg.src].join(path.sep);
module.exports = {
  context: srcPath,
  output: {
    path:  pkg.dist,
    filename: '[name]-[hash:6].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: '//localhost:'+ pkg.port.dev +'/assets/',
    pathinfo: true
  },

  cache: true,
  debug: true,
  devtool: 'sourcemap',

  entry: [
      'webpack/hot/only-dev-server',
      srcPath + '/entry/a.js'
  ],

  stats: {
    colors: true,
    reasons: true
  },

  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      'styles': path.join(__dirname, pkg.src , 'styles'),
      'mixins': path.join(__dirname, pkg.src , '/mixins'),
      'components': path.join(__dirname, pkg.src , '/components'),
      'stores': path.join(__dirname, pkg.src , '/stores'),
      'actions': path.join(__dirname, pkg.src , '/actions'),
      'images': path.join(__dirname, pkg.src , '/images'),
    }
  },
  module: {
    preLoaders: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }],
    loaders: [{
      test: /\.(js|jsx)$/,
      include: pkg.src,
      exclude: /node_modules/,
      loader: 'react-hot!babel-loader?presets[]=es2015&presets[]=react&presets[]=stage-0',
      // query: {
      //   presets: ['es2015', 'react', 'stage-0'],
      // }
    }, {
      test: /\.css$/,
      loader: ExtractPlugin.extract('style', 'css')
    }, {
      test: /\.s[ac]ss$/,
      loader: ExtractPlugin.extract('style', 'css!sass')
    }, {
      test: /\.styl$/,
      loader: ExtractPlugin.extract('style', 'css!stylus')
    }, {
      test: /\.(png|jpg|woff|woff2)$/,
      loader: 'url?name=[path][name]-[hash:6].[ext]&limit=8192'
    }]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ExtractPlugin('[name]-[contenthash:6].css'),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      children: true,
      minChunks: 2,
    }),
    new assetsExportPlugin(__dirname + '/webpack-main-assets.json')
  ]

};
