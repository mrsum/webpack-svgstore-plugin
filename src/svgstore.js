'use strict';

// Defaults
var _options = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  svgoOptions: {},
  name: 'sprite.[hash].svg',
  prefix: 'icon-',
  template: __dirname + '/templates/layout.pug'
};

// Depends
var _ = require('lodash');
var path = require('path');
var slash = require('slash');
var utils = require('./helpers/utils');

/**
 * Constructor
 * @param {string} input   [description]
 * @param {string} output  [description]
 * @param {object} options [description]
 * @return {object}
 */
var WebpackSvgStore = function(options) {
  this.options = _.merge({}, _options, options);
  return this;
};

/**
 * Runner method
 * @param  {[type]} compiler [description]
 * @return {[type]}          [description]
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var tasks = [];
  var options = this.options;

  // vars find plugin marks
  compiler.parser.plugin('call webpackSvgStore', function(expr) {
    var input       = expr.arguments[0].value ? expr.arguments[0].value : false;
    var spriteName  = expr.arguments[1].value ? expr.arguments[1].value : false;

    // check arguments
    input && spriteName
      ? tasks.push({ input, spriteName, file: this.state.current, expr })
      : null;
  });

  compiler.plugin('emit', function(compilation, callback) {
    tasks.length > 0 ? tasks.forEach(function(entity) {
      var spriteName = entity.spriteName;
      var relativePath = options.relative;

      // iterate by entities
      utils.filesMap(entity.input, function(files) {
        var fileContent = utils.createSprite(
          utils.parseFiles(files, options),
          options.template
        );

        var fileName = utils.hash(fileContent, spriteName);
        var filePath = path.join(relativePath, fileName);

        // add sprite to assets
        compilation.assets[slash(filePath)] = {
          size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
          source: function() { return new Buffer(fileContent); }
        };

        // replace source link to load function
        entity.file.source().replace(
          entity.expr.range[0],
          entity.expr.range[1],
          utils.svgXHR(filePath, options.baseUrl)
        );
      });
    }) : null;

    callback();
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
