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

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('optimize-tree', function(chunks, modules) {
      console.log(chunks);
    });
    // callback();
  });
  
  compiler.parser.plugin('call webpackSvgStore', function (expr) {
    let value = false;
    console.log(expr);
    // expr.arguments[0] && expr.arguments[1]
    //   ? value = new Putin(expr, expr.arguments[0], expr.arguments[1])
    //   : null;
    // return value;
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
