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
  compiler.parser.plugin('call webpackSvgStore', function(expr) {

    let input   = expr.arguments[0].value ? expr.arguments[0].value : false;
    let output  = expr.arguments[1].value ? expr.arguments[1].value : false;

    console.log(input, output, this.state.current.resource);

    //console.log(this.evaluateExpression(expr.arguments[0].string));
  });

  compiler.plugin('emit', function(compilation) {
        
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
