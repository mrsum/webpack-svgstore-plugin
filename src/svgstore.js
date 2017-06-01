'use strict';

// Defaults
const defaults = {
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
const _ = require('lodash');
const path = require('path');
const utils = require('./helpers/utils');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');
const NullFactory = require('webpack/lib/NullFactory');
const async = require('async');

class WebpackSvgStore {

  /**
   * Constructor
   * @param {string} input   [description]
   * @param {string} output  [description]
   * @param {object} options [description]
   * @return {object}
   */
  constructor(options) {
    this.tasks = {};
    this.options = _.merge({}, defaults, options);

    if (this.options.path && !path.isAbsolute(this.options.path)) {
      throw new Error('[webpack-svgstore-plugin] Validation Error: path should be absolute when passed as plugin option')
    }
  };

  addTask(file, value) {
    this.tasks[file] ? this.tasks[file].push(value) : (() => {
        this.tasks[file] = [];
        this.tasks[file].push(value);
      })();
  }

  createTaskContext(expr, parser) {
    const data = {
      path: this.options.path || '/**/*.svg',
      fileName: this.options.name || '[hash].sprite.svg',
      context: this.options.path ? '' : parser.state.current.context
    };

    expr.init.properties.forEach(function (prop) {
      switch (prop.key.name) {
        case 'name':
          data.fileName = prop.value.value;
          break;
        case 'path':
          data.path = prop.value.value;
          break;
        default:
          break;
      }
    });

    data.fileName = utils.hash(data.fileName, parser.state.current.buildTimestamp);
    let replacement = expr.id.name + ' = { filename: ' + "__webpack_require__.p +" + '"' + data.fileName + '" }';
    let dep = new ConstDependency(replacement, expr.range);
    dep.loc = expr.loc;
    parser.state.current.addDependency(dep);
    // parse repl
    this.addTask(parser.state.current.request, data);
  }

  apply(compiler) {
    // AST parser
    compiler.plugin('compilation', (compilation, data) => {

      compilation.dependencyFactories.set(ConstDependency, new NullFactory());
      compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());

      data.normalModuleFactory.plugin('parser', (parser, options) => {
        parser.plugin('statement', (expr) => {
          if (!expr.declarations || !expr.declarations.length) return;
          const thisExpr = expr.declarations[0];
          if (thisExpr.id.name === "__svg__") {
            return this.createTaskContext(thisExpr, parser);
          }
        });
      });
    });


    // save file to fs
    compiler.plugin('emit', (compilation, callback) => {
      async.forEach(Object.keys(this.tasks),
        (key, outerCallback) => {
          async.forEach(this.tasks[key],
            (task, callback) => {
              utils.filesMap(path.join(task.context, task.path || ''), (files) => {
                // fileContent
                const fileContent = utils.createSprite(
                  utils.parseFiles(files, this.options), this.options.template);

                // add sprite to assets
                compilation.assets[task.fileName] = {
                  size: function () {
                    return Buffer.byteLength(fileContent, 'utf8');
                  },
                  source: function () {
                    return new Buffer(fileContent);
                  }
                };
                // done
                callback();
              });
            }, outerCallback);
        }, callback);
    });

    compiler.plugin('done', () => {
      this.tasks = {};
    });
  }
}


/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
