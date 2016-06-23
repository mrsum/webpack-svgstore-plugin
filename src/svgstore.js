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
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');

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

WebpackSvgStore.prototype.apply = function(compiler) {
  var tasks = {};
  var options = this.options;
  var memoize = function(file, value) {
    tasks[file]
      ? tasks[file].push(value)
      : function() { tasks[file] = []; tasks[file].push(value); }();
  };

  var analyzeAst = function(expr) {
    var data = {
      path: '/**/*.svg',
      fileName: '[hash].sprite.svg',
      context: this.state.current.context
    };
    var timeStamp = this.state.current.buildTimestamp;
    expr.init.properties.forEach(function(prop) {
      switch(prop.key.name) {
        case 'name': data.fileName = utils.hash(timeStamp, prop.value.value); break;
        case 'path': data.path = prop.value.value;
        default: break;
      }
    });

    var replacement = expr.id.name + ' = { filename: "' + data.fileName + '" }';
    var dep = new ConstDependency(replacement, expr.range);
    dep.loc = expr.loc;
    this.state.current.addDependency(dep);

    memoize(this.state.current.request, data);
  };

  // AST parser
  compiler.parser.plugin('var __svg__', analyzeAst);
  compiler.parser.plugin('var __sprite__', analyzeAst);
  compiler.parser.plugin('var __svgstore__', analyzeAst);
  compiler.parser.plugin('var __svgsprite__', analyzeAst);
  compiler.parser.plugin('var __webpack_svgstore__', analyzeAst);

  // save file to fs
  compiler.plugin('emit', function(compilation, callback) {
    Object.keys(tasks).forEach(function(key) {
      tasks[key].forEach(function(task) {
        utils.filesMap(path.join(task.context, task.path || ''), function(files) {
          // fileContent
          var fileContent = utils.createSprite(
            utils.parseFiles(files, options),
            options.template
          );

          // add sprite to assets
          compilation.assets[task.fileName] = {
            size: function() { return Buffer.byteLength(fileContent, 'utf8'); },
            source: function() { return new Buffer(fileContent); }
          };
        });
      });
    });

    tasks = {};
    callback();
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
