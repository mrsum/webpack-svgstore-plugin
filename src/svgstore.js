'use strict';

// Defaults
const defaults = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': "http://www.w3.org/1999/xlink",
    style: 'position:absolute; width: 0; height: 0'
  },
  svgoOptions: {},
  prefix: 'icon-',
  template: __dirname + '/templates/layout.pug',
  path: '',
  fileName: 'sprite.[hash].svg'
};

// Depends
const _ = require('lodash');
const path = require('path');
const utils = require('./helpers/utils');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');
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
  };

  parseRepl(file, value) {
    this.tasks[file] ? this.tasks[file].push(value) : (() => {
      this.tasks[file] = [];
      this.tasks[file].push(value);
    })();
  }

  analyzeAst() {
    let self = this;
    return function (expr) {
      const data = {
        path: self.options.path,
        fileName: self.options.fileName,
        context: this.state.current.context
      };

      data.fileName = utils.hash(data.fileName, this.state.current.buildTimestamp);
      let replacement = expr.name + ' = "' + data.fileName + '"';
      let dep = new ConstDependency(replacement, expr.range);
      dep.loc = expr.loc;
      this.state.current.addDependency(dep);
      // parse repl
      self.parseRepl(this.state.current.request, data);
    };
  }

  apply(compiler) {
    // AST parser
    compiler.plugin('compilation', (compilation, data) => {
      let analzyerFunc = this.analyzeAst();
      data.normalModuleFactory.plugin('parser', (parser) => {
        parser.plugin('var __svg__', analzyerFunc);
      })
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
