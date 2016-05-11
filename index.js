'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  loop: 2,
  svgoOptions: {},
  name: 'sprite.[hash].svg',
  prefix: 'icon-'
};

// Depends
var _ = require('lodash');
var path = require('path');
var url = require('url');
var slash = require('slash');
var utils = require('./helpers/utils');
var ConcatSource = require('webpack/lib/ConcatSource');
var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers');

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
  var chunkWrapper;
  var publicPath;

  var options = this.options;

  var inputFolder = this.input;
  var outputFolder = this.output;
  var spriteName = this.options.name;

  // subscribe to webpack emit state
  compiler.plugin('compilation', function(compilation) {
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
      if (!utils.filesChanged(files)){
        return;
      }
      var fullPath;
      var fileContent = utils.createSprite(utils.parseFiles(files, options));
      var fileName = utils.hash(fileContent, spriteName);
      var filePath = path.join(outputFolder, fileName);

      // resolve with node url
      fullPath = url.resolve(publicPath, filePath);

      compilation.assets[slash(filePath)] = {
        size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
        source: function() { return new Buffer(fileContent); }
      };

      // if chunk enable apply to chunk
      if (options && options.chunk) {
        chunkWrapper = options.chunk;
        compilation.plugin('optimize-chunk-assets', function(chunks, callback) {
          chunks.forEach(function(chunk) {
            if (options.entryOnly && !chunk.initial) return;
            if (chunk.name === chunkWrapper) {
              chunk.files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options)).forEach(function(file) {
                if (/\.js?$/.test(file)) {
                  compilation.assets[file] = new ConcatSource(utils.svgXHR(fullPath, options.baseUrl), '\n', compilation.assets[file]);
                }
              });
            }
          });
          callback();
        });
      }
    });
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
