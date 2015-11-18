'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  loop: 2,
  prefix: 'icon-',
  name: 'sprite.[hash].svg',
  ajaxWrapper: false
};

// Depends
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var jade = require('jade');
var parse = require('htmlparser2');
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
  // in case if array was passed
  if (input instanceof Array) {
    var files = [];
    input.forEach(function(input) {
      this.filesMap(input, function(fileList) {
        files = files.concat(fileList);
      });
    });
    console.log(files);
    cb(files);
  } else {
    glob(input, function(error, fileList) {
      if (error) {
        throw error;
      }
      // slice off pattern
      cb(fileList.slice(1));
    });
  }
};

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
WebpackSvgStore.prototype.parseDomObject = function(data, filename, dom) {
  var id = utils.convertFilenameToId(filename);
  if (dom && dom[0]) {
    utils.defs(id, dom[0], data.defs);
    utils.symbols(id, dom[0], data.symbols);
  }

  return data;
};

/**
 * [parseFiles description]
 * @return {[type]} [description]
 */
WebpackSvgStore.prototype.parseFiles = function(files) {
  var self = this;
  var data = {
    svg: this.options.svg,
    defs: [],
    symbols: []
  };

  // each over files
  files.forEach(function(file) {
    var svgoOptions = _.assign({}, self.options.svgoOptions);
    // load and minify
    var buffer = utils.minify(fs.readFileSync(file, 'utf8'), self.options.loop, svgoOptions);
    // get filename for id generation
    var filename = path.basename(file, '.svg');
    var handler = new parse.DomHandler(function(error, dom) {
      if (error) utils.log(error);
      else data = self.parseDomObject(data, filename, dom);
    });

    // lets create parser instance
    var Parser = new parse.Parser(handler);
    Parser.write(buffer);
    Parser.end();
  });

  return data;
};

/**
 * Parse files
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
WebpackSvgStore.prototype.createSprite = function(data) {
  return jade.renderFile(path.join(__dirname, 'templates', 'layout.jade'), data);
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
      var fileContent = self.createSprite(self.parseFiles(files));
      var fileName = utils.hash(fileContent, spriteName);
      var filePath = outputFolder ? path.join(outputFolder, fileName) : fileName;

      compilation.assets[filePath] = {
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
                compilation.assets[file] = new ConcatSource(utils.svgXHR([publicPath, fileName].join('/')), '\n', compilation.assets[file]);
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
