'use strict';

// Depends
var path = require('path');
var SvgStore = require('../index');

module.exports = function(_path) {
  // define local variables
  var distPath = path.join(_path, 'platform', 'dist');
  var sourcePath = path.join(_path, 'platform', 'static');

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
      new SvgStore(path.join(sourcePath, 'svg', '**/*.svg'), path.join('svg'), {
        name: '[hash].sprite.svg',
        chunk: 'app',
        svgoOptions: {}
      })
    ]
  };
};
