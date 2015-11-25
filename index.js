'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  loop: 2,
  svgoOptions: {},
  name: 'sprite.[hash].svg'
};

// Depends
var _ = require('lodash');
var glob = require('glob');
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
  this.input    = input;
  this.output   = output;
  this.options  = _.merge(_options, options);

  return this;
};

/**
 * Build files map
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
WebpackSvgStore.prototype.filesMap = function(input, cb) {
  var files = [];
  var data = input;
  // in case if array was passed
  if (data instanceof Array) {
    data.forEach(function(source) {
      this.filesMap(source, function(fileList) {
        files = files.concat(fileList);
      });
    });
    cb(files);
  } else {
    glob(data, function(error, fileList) {
      if (error) {
        throw error;
      }
      // slice off pattern
      cb(fileList);
    });
  }
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var chunkWrapper;
  var publicPath;

  var self = this;
  var options = this.options;
  var inputFolder = this.input;
  var outputFolder = this.output;
  var spriteName = this.options.name;

  // prepare input / output folders
  utils.prepareFolder(inputFolder);
  utils.prepareFolder(outputFolder);

  // subscribe to webpack emit state
  compiler.plugin('compilation', function(compilation) {
    publicPath = compilation.getStats().toJson().publicPath || '/';
    self.filesMap(inputFolder, function(files) {
      var fileContent = utils.createSprite(utils.parseFiles(files, options));
      var fileName = utils.hash(fileContent, spriteName);

      compilation.assets[[outputFolder, fileName].join('/')] = {
        size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
        source: function() { return new Buffer(fileContent); }
      };

      // if chunk enable
      if (options && options.chunk) {
        chunkWrapper = options.chunk;
        compilation.plugin('optimize-chunk-assets', function(chunks, callback) {
          chunks.forEach(function(chunk) {
            if (options.entryOnly && !chunk.initial) return;
            if (chunk.name === chunkWrapper) {
              chunk.files.filter(ModuleFilenameHelpers.matchObject.bind(undefined, options)).forEach(function(file) {
                if (/\.js?$/.test(file)) {
                  compilation.assets[file] = new ConcatSource(utils.svgXHR([publicPath, fileName].join('/')), '\n', compilation.assets[file]);
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
