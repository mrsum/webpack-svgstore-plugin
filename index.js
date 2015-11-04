'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  data: [],
  loop: 1,
  prefix: 'icon-',
  name: 'sprite.svg',
  ajaxWrapper: false
};

// Depends
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var Svgo = require('svgo');
var walk = require('walk');
var jade = require('jade');
var parse = require('htmlparser2');
var utils = require('./helpers/utils');

/**
 * Binding context to function
 * @param  {[type]} obj      [description]
 * @param  {[type]} funcname [description]
 * @return {[type]}          [description]
 */
var bind = function(obj, funcname) {
  return function() {
    return obj[funcname].apply(obj, arguments);
  };
};

/**
 * Convert filename to id
 * @param  {string} filename [description]
 * @return {string}          [description]
 */
var convertFilenameToId = function(filename) {
  var _name = filename;
  var dotPos = filename.indexOf('.');
  if (dotPos > -1) {
    _name = filename.substring(0, dotPos);
  }
  return _name;
};

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
 * Check folder
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
WebpackSvgStore.prototype.prepareFolder = function(folder) {
  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    return true;
  } catch (e) {
    return false;
  }
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
 * Minify each svg file
 * @param  {[type]} file [description]
 * @param  {[type]} loop [description]
 * @return {[type]}      [description]
 */
WebpackSvgStore.prototype.minify = function(file, loop) {
  var i;
  var minify = new Svgo();
  var source = file;

  function svgoCallback(result) {
    source = result.data;
  }

  // optimize loop
  for (i = 1; i <= loop; i++) {
    minify.optimize(source, svgoCallback);
  }

  return source;
};

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
WebpackSvgStore.prototype.parseDomObject = function(data, filename, dom) {
  var id = convertFilenameToId(filename);
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
    var buffer = self.minify(fs.readFileSync(file, 'utf8'), self.options.loop);
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
  return jade.renderFile('templates/layout.jade', data);
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var inputFolder = this.input;
  var outputFolder = this.output;
  var spriteName = this.options.name;
  var filesMap = bind(this, 'filesMap');
  var parseFiles = bind(this, 'parseFiles');
  var createSprite = bind(this, 'createSprite');

  // prepare input / output folders
  this.prepareFolder(inputFolder);
  this.prepareFolder(outputFolder);

  compiler.plugin('emit', function(compilation, callback) {
    filesMap(inputFolder, function(files) {
      var fileContent = createSprite(parseFiles(files));
      var hash = utils.hash(fileContent, spriteName);
      compilation.assets[hash] = {
        size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
        source: function() { return new Buffer(fileContent); }
      };
      callback();
    });
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
