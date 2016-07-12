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

WebpackSvgStore.prototype.apply = function(compiler) {
  var tasks = {};
  var options = this.options;
  var parseRepl = function(file, value) {
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
    var pathArray = [];
    var replacement = false;
    var dep = false;
    var timeStamp = this.state.current.buildTimestamp;
    expr.init.properties.forEach(function(prop) {
      var elements = prop.value.elements;
      // check path for elements array
      if (prop.key.name === 'path' && elements && elements.length) {
        elements.forEach(function(item) {
          pathArray.push(item.value);
        });
      }
      switch (prop.key.name) {
        case 'name': data.fileName = utils.hash(timeStamp, prop.value.value); break;
        case 'path': data.path = elements ? pathArray : prop.value.value; break;
        default: break;
      }
    });

    replacement = expr.id.name + ' = { filename: "' + data.fileName + '" }';
    dep = new ConstDependency(replacement, expr.range);
    dep.loc = expr.loc;
    this.state.current.addDependency(dep);
    // parse repl
    parseRepl(this.state.current.request, data);
  };

  // AST parser
  compiler.parser.plugin('var __svg__', analyzeAst);
  compiler.parser.plugin('var __sprite__', analyzeAst);
  compiler.parser.plugin('var __svgstore__', analyzeAst);
  compiler.parser.plugin('var __svgsprite__', analyzeAst);
  compiler.parser.plugin('var __webpack_svgstore__', analyzeAst);

  // save file to fs
  compiler.plugin('emit', function(compilation, callback) {
    async.forEach(Object.keys(tasks), function(key, callback) {
      async.forEach(tasks[key], function(task, callback) {
        var paths = [];
        var taskPath = task.path;
        if (taskPath instanceof Array) {
          taskPath.forEach(function(item) {
            paths.push(path.join(task.context, item));
          });
        }
        utils.filesMap(paths.length ? paths : path.join(task.context, task.path || ''), function(files) {
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
          // done
          callback();
        });
      }.bind(this), callback);
    }.bind(this), callback);
  }.bind(this));

  compiler.plugin('done', function() {
    tasks = {};
  });
};


/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
