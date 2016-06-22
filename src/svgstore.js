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
var utils = require('./helpers/utils');
var async = require('async');

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
  var svgs = [];
  var tasks = [];
  var suggests = [];
  var options = this.options;


  /**
   * Analyze AST
   * @param  {[type]} expr [description]
   * @return {[type]}      [description]
   */
  var analyze = function(expr) {
    suggests.push(this.state.current.userRequest);
    tasks.push({
      expr: expr,
      context: this.state.current.context,
      file: this.state.current.userRequest,
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

  compiler.plugin('compilation', function(compilation) {
    compilation.plugin('optimize-chunk-assets', function(chunks, callback) {
      chunks.forEach(function(chunk) {
      // async.forEach(chunks, function(chunk, callback) {
        chunk.modules.forEach(module => {
          // check tasks for each modules
          if (suggests.indexOf(module.resource) > -1) {
            // run
            tasks.length > 0 ? async.forEach(tasks, function(task) {
              var commands = {};
              var fileName = '[hash].icons.svg';
              task.commands.forEach(function(command) {
                commands[command.key] = command.value;
              });

              // generate filename
              fileName = utils.hash(compilation.hash, commands.name || '[hash].icons.svg');

              // replace for original source
              module.source().replace(
                task.expr.range[0],
                task.expr.range[1],
                `${task.expr.id.name} = {sprite: '${fileName}'};`
              );

              // console.log(module.source());
              svgs.push({file: fileName, commands: commands, task: task});
            }) : null;
          }
        });
      });
      callback();
    });
  });

  // save file to fs
  compiler.plugin('emit', function(compilation, callback) {
    svgs.forEach(function(svg) {
      // iterate by entities
      utils.filesMap(path.join(svg.task.context, svg.commands.path || ''), function(files) {
        var fileContent = utils.createSprite(
          utils.parseFiles(files, options),
          options.template
        );

        // add sprite to assets
        compilation.assets[svg.file] = {
          size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
          source: function() { return new Buffer(fileContent); }
        };
      });
    });

    callback();
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
