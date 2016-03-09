/*
 * Webpack distribution configuration
 *
 * This file is set up for serving the distribution version. It will be compiled to dist/ by default
 */

'use strict';

var webpack = require('webpack');

var assetsExportPlugin = require('./AssetsExportPlugin');

var ExtractPlugin = require('extract-text-webpack-plugin');

module.exports = {

  output: {
    publicPath: '/assets/',
    path: 'dist/assets/',
    filename: '[name]-[hash:8].js'
  },

  debug: false,
  devtool: false,

  // overwrite in grunt entry;
  // entry: './src/components/main.js',

  stats: {
    colors: true,
    reasons: false
  },

  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
    new ExtractPlugin('[name]-[contenthash:8].css'),
    new assetsExportPlugin(__dirname + '/webpack-main-assets.json'),
    new webpack.NoErrorsPlugin()
  ],

  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      'styles': __dirname + '/src/styles',
      'mixins': __dirname + '/src/mixins',
      'components': __dirname + '/src/components/',
      'stores': __dirname + '/src/stores/',
      'actions': __dirname + '/src/actions/',
      'images': __dirname + '/src/images/',
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
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015', 'react', 'stage-0'],
      }
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
  }
};
