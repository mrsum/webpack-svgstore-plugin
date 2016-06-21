'use strict';

// Depends
var path = require('path');
var SvgStore = require('../src/svgstore');

module.exports = function(_path) {
  // define local variables
  var distPath = path.join(_path, 'platform', 'dist');
  var sourcePath = path.join(_path, 'platform', 'static');

  return {
    entry: {
      app: path.join(_path, 'platform', 'static', 'js', 'index.js'),
      // app1: path.join(_path, 'platform', 'static', 'js', 'one-more.js'),
    },
    output: {
      path: distPath,
      filename: '[chunkhash].[name].js',
      chunkFilename: '[chunkhash].[id].js',
      publicPath: '/platform/'
    },
    resolve: {
      extensions: ['', '.js'],
    },
    module: {
      loaders: [
        { test: /\.svgjs$/, loader: SvgStore.extract() },
      ]
    },
    plugins: [
      // create svgStore instance object
      new SvgStore.Options({
        // path, from webpack context
        output: '/platform/dist/svg/',
        // svgo options
        svgoOptions: {
          plugins: [
            { removeTitle: true }
          ]
        }
      })
    ]
  };
};
