// Depends
const path = require('path');
const SvgStore = require('../src/svgstore');

module.exports = function (_path) {
  // define local variables
  const distPath = path.join(_path, 'platform', 'dist');

  return {
    entry: {
      app: path.join(_path, 'platform', 'static', 'js', 'index.js')
    },
    output: {
      path: distPath,
      filename: '[chunkhash].[name].js',
      chunkFilename: '[chunkhash].[id].js',
      publicPath: '/platform/'
    },
    resolve: {
      extensions: ['.js']
    },
    plugins: [
      // create svgStore instance object
      new SvgStore.Options({
        // svgo options
        svgoOptions: {
          plugins: [{ removeTitle: true }]
        }
      })
    ]
  };
};
