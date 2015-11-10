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
var walk = require('walk');
var jade = require('jade');
var parse = require('htmlparser2');
var utils = require('./helpers/utils');

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
  var walker = walk.walk(input, { followLinks: true });

  walker.on('file', function(root, stat, next) {
    files.push(root + '/' + stat.name);
    next();
  });

  walker.on('end', function() {
    cb(files);
  });
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

  // each over fils
  files.forEach(function(file) {
    // load and minify
    var buffer = utils.minify(fs.readFileSync(file, 'utf8'), self.options.loop);
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
  var ajaxWrapper;
  var ajaxWrapperFileName;
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
  compiler.plugin('emit', function(compilation, callback) {
    publicPath = compilation.getStats().toJson().publicPath || '/';
    self.filesMap(inputFolder, function(files) {
      var fileContent = self.createSprite(self.parseFiles(files));
      var hash = utils.hash(fileContent, spriteName);

      compilation.assets[hash] = {
        size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
        source: function() { return new Buffer(fileContent); }
      };

      // if ajaxWrapper enable
      if (options && options.ajaxWrapper) {
        ajaxWrapper = utils.svgXHR([publicPath, hash].join('/'));
        ajaxWrapperFileName = options.ajaxWrapper.name || 'svgxhr.js';
        ajaxWrapperFileName = utils.hash(ajaxWrapper, ajaxWrapperFileName);

        compilation.assets[ajaxWrapperFileName] = {
          size: function() { return Buffer.byteLength(ajaxWrapper, 'utf8'); },
          source: function() { return new Buffer(ajaxWrapper); }
        };
      }

      callback();
    });
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
