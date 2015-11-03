'use strict';

// Defaults
var _options = {
  min: false,
  svg: {
    xmlns: 'http://www.w3.org/2000/svg'
  },
  loop: 1,
  prefix: 'icon-',
  ajaxWrapper: false
};

// Depends
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var svgo = require('svgo');
var walk = require('walk');


/**
 * Constructor
 * @param {string} input   [description]
 * @param {string} output  [description]
 * @param {object} options [description]
 * @return {object}
 */
var WebpackSvgStore = function(input, output, options) {

  this.input = input;
  this.output = output;
  this.options = _.merge(_options, options);

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
 * Minify each svg file
 * @param  {[type]} file [description]
 * @param  {[type]} loop [description]
 * @return {[type]}      [description]
 */
WebpackSvgStore.prototype.minify = function (file, loop) {
  var i;
  var svgo = new svgo();
  var source = file;

  function svgoCallback(result) {
    source = result.data;
  }

  // optimize loop
  for (i = 1; i <= loop; i++) {
    svgo.optimize(source, svgoCallback);
  }

  return source;
};

/**
 * [parse description]
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
WebpackSvgStore.prototype.parse = function (files) {
  console.log(files);
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  // prepare input / output folders
  this.prepareFolder(this.input);
  this.prepareFolder(this.output);

  // get files from source path
  this.filesMap(this.input, function(files) {
    // run to files
    files.map(function(file) {
      console.log(file);
    })
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
