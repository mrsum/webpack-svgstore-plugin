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
 * Filename converter
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
var convertNameToId = function(name) {
  var _name = name;
  var dotPos = name.indexOf('.');
  if (dotPos > -1) {
    _name = name.substring(0, dotPos);
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
 * Calculate hash
 * @param  {object} buffer [description]
 * @param  {string} name   [description]
 * @return {string}        [description]
 */
WebpackSvgStore.prototype.hash = function(buffer, name) {
  

  console.log(buffer, name);
};

/**
 * Add new tag
 * @param {[type]} action     [description]
 * @param {[type]} name       [description]
 * @param {[type]} attributes [description]
 */
WebpackSvgStore.prototype.addTag = function(action, name, attributes) {
  console.log(action, name, attributes);
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
 * [parseDomObject description]
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
WebpackSvgStore.prototype.parseDomObject = function(filename, dom) {
  console.log(filename, dom);
};

/**
 * [parseFiles description]
 * @return {[type]} [description]
 */
WebpackSvgStore.prototype.parseFiles = function(files) {
  var self = this;
  // result data
  var data = {
    svg: this.options.svg,
    defs: []
  };

  files.forEach(function(file) {
    // load and minifi
    var buffer = self.minify(fs.readFileSync(file, 'utf8'), self.options.loop);
    // get filename for id generation
    var filename = path.basename(file, '.svg');
    var handler = new parse.DomHandler(function (error, dom) {
      if (error) console.log(error);
      else self.parseDomObject(filename, dom);
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
WebpackSvgStore.prototype.createSprite = function (data) {
  return jade.renderFile('templates/layout.jade', data);
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var parseFiles = bind(this, 'parseFiles');
  var createSprite = bind(this, 'createSprite');

  // prepare input / output folders
  this.prepareFolder(this.input);
  this.prepareFolder(this.output);

  // get files from source path
  this.filesMap(this.input, function(files) {
    createSprite(parseFiles(files));
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
