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
  let tasks = [];

  // lets find plugin marks
  compiler.parser.plugin('call webpackSvgStore', function(expr) {
    let input       = expr.arguments[0].value ? expr.arguments[0].value : false;
    let spriteName  = expr.arguments[1].value ? expr.arguments[1].value : false;

    // check arguments
    input && spriteName
      ? tasks.push({ input, spriteName, file: this.state.current })
      : null;
  });

  compiler.plugin('emit', (compilation, callback) => {
    tasks.forEach(entity => {
      let options = this.options;
      let spriteFolder = options.output;
      let spriteName = entity.spriteName;
      let relativePath = options.relative;

      // prepare output folder
      utils.prepareFolder(spriteFolder);

      utils.filesMap(entity.input, function(files) {
        let fileContent = utils.createSprite(
          utils.parseFiles(files, options),
          options.template
        );

        let fileName = utils.hash(fileContent, spriteName);
        let filePath = path.join(relativePath, fileName);

        compilation.assets[slash(filePath)] = {
          size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
          source: function() { return new Buffer(fileContent); }
        };

        callback();
      });
    });
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
