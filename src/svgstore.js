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

  /**
   * Analyze AST
   * @param  {[type]} expr [description]
   * @return {[type]}      [description]
   */
  var analyze = function(expr) {
    tasks.push({
      expr: expr,
      context: this.state.current.context,
      current: this.state.current,
      commands: expr.init.properties.map(function(item) {
        return { key: item.key.name.toString(), value: item.value.value.toString() };
      })
    });
  };

  // AST parser
  compiler.parser.plugin('var __svg__', analyze);
  compiler.parser.plugin('var __sprite__', analyze);
  compiler.parser.plugin('var __svgstore__', analyze);
  compiler.parser.plugin('var __svgsprite__', analyze);
  compiler.parser.plugin('var __webpack_svgstore__', analyze);

  // run the trap
  compiler.plugin('emit', function(compilation, callback) {
    tasks.length > 0 ? tasks.forEach(function(task) {
      // parse commands from variable
      var commands = {};
      task.commands.forEach(function(command) {
        commands[command.key] = command.value;
      });

      // iterate by entities
      utils.filesMap(path.join(task.context, commands.path || ''), function(files) {
        var fileContent = utils.createSprite(
          utils.parseFiles(files, options),
          options.template
        );

        // generate filename
        var fileName = utils.hash(fileContent, commands.name || '[hash].icons.svg');

        // add sprite to assets
        compilation.assets[slash(fileName)] = {
          size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
          source: function() { return new Buffer(fileContent); }
        };
        // replace original source
        task.current.source().replace(
          task.expr.range[0],
          task.expr.range[1],
          `${task.expr.id.name} = {file: '${fileName}'};`
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
module.exports.Options = WebpackSvgStore;
module.exports.extract = function(source) {
  return source;
};
