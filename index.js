'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    style: 'position:absolute; width: 0; height: 0'
  },
  loop: 2,
  svgoOptions: {},
  name: 'sprite.[hash].svg',
  prefix: 'icon-',
  template: __dirname + '/templates/layout.jade'
};

// Depends
var _ = require('lodash');
var path = require('path');
var url = require('url');
var slash = require('slash');
var utils = require('./helpers/utils');
var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

var ConcatSource;
try {
  ConcatSource = require('webpack/lib/ConcatSource');       // webpack 1.x
} catch (e) {
  ConcatSource = require('webpack-sources').ConcatSource;   // webpack 2.x
}

/**
 * Constructor
 * @param {string} input   [description]
 * @param {string} output  [description]
 * @param {object} options [description]
 * @return {object}
 */
var WebpackSvgStore = function(input, output, options) {
  // set attributes
  this.input   = input;
  this.output  = output;
  this.options = _.merge({}, _options, options);

  return this;
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var publicPath;

  var options = this.options;

  var inputFolder = this.input;
  var outputFolder = this.output;
  var spriteName = this.options.name;
  var lastXhrText;

  // subscribe to webpack emit state
  compiler.plugin('emit', function(compilation, callback) {
    // path into dist absolute path
    publicPath = compilation.getStats().toJson().publicPath;

    if (!publicPath) {
      publicPath = path.isAbsolute(outputFolder)
        ? outputFolder
        : '/'
      ;
    }

    // prepare output folder
    utils.prepareFolder(outputFolder);

    utils.filesMap(inputFolder, function(files) {
      var fullPath;
      var fileContent;
      var fileName;
      var filePath;

      if (!utils.filesChanged(files)) {
        injectXhr(options, compilation, lastXhrText);
        return callback();
      }

      fileContent = utils.createSprite(utils.parseFiles(files, options), options.template);
      fileName = utils.hash(fileContent, spriteName);
      filePath = path.join(outputFolder, fileName);

      // resolve with node url
      fullPath = url.resolve(publicPath, filePath);

      compilation.assets[slash(filePath)] = {
        size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
        source: function() { return new Buffer(fileContent); }
      };

      lastXhrText = utils.svgXHR(fullPath, options.baseUrl);
      injectXhr(options, compilation, lastXhrText);

      callback();
    });
  });

  function injectXhr(opt, compilation, lxt) {
    var chunk;
    // if chunk enable apply to chunk
    if (opt && opt.chunk) {
      chunk = _.find(compilation.chunks, {name: opt.chunk});
      if (!chunk) return;
      chunk.files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, opt)).forEach(function(file) {
        if (/\.js?$/.test(file)) {
          compilation.assets[file] = new ConcatSource(lxt, '\n', compilation.assets[file]);
        }
      });
    }
  }
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
