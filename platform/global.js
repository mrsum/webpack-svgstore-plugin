'use strict';

// Depends
var path = require('path');
var SvgStore  = require('../index');
var Manifest  = require('manifest-revision-webpack-plugin');
var HtmlPlugin = require('html-webpack-plugin');

var jsonPresent = function(data, parsedAssets) {
  var output = {};
  var obj = parsedAssets;

  // remove path
  for (var key in obj) {
    var newkey = key.split('/').pop();
    obj[newkey] = obj[key];
    delete obj[key];
  }

  output.publicPath = data.publicPath;
  output.assetsByChunkName = data.assetsByChunkName;
  output.assets = obj;

  return output;
};

module.exports = function(_path) {

  // define local variables
  var distPath = path.join(_path, 'platform', 'dist');
  var sourcePath = path.join(_path, 'platform', 'static');
  var manifestPath = path.join(distPath, 'manifest.json');

  return {
    entry: {
      app: path.join(_path, 'platform', 'static', 'js', 'index.js'),
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
    plugins: [
      // create svg sprite from /path to /path with temp /path
      new SvgStore(path.join(sourcePath, 'svg'), path.join(distPath, 'svg'))
    ]
  };
};
