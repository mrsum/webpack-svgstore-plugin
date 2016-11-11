'use strict';

// Defaults
const defaults = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': "http://www.w3.org/1999/xlink",
    style: 'position:absolute; width: 0; height: 0'
  },
  svgoOptions: {},
  name: 'sprite.[hash].svg',
  prefix: 'icon-',
  template: __dirname + '/templates/layout.pug'
};

// Depends
const path = require('path');
const utils = require('./helpers/utils');
const async = require('async');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');

/**
 * Constructor
 * @param {string} input   [description]
 * @param {string} output  [description]
 * @param {object} options [description]
 * @return {object}
 */
const WebpackSvgStore = function (options) {
  this.options = Object.assign({}, defaults, options);
  return this;
};

WebpackSvgStore.prototype.apply = function (compiler) {
  let tasks = {};
  const options = this.options;
  const parseRepl = (file, value) => {
    tasks[file]
      ? tasks[file].push(value)
      : (() => { tasks[file] = []; tasks[file].push(value); })();
  };

  const analyzeAst = function (expr) {
    let dep = false;
    const data = {
      path: '/**/*.svg',
      fileName: '[hash].sprite.svg',
      context: this.state.current.context
    };
    let replacement = '';

    expr.init.properties.forEach((prop) => {
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

    data.fileName = utils.hash(data.fileName, this.state.current.buildTimestamp);

    replacement = `${expr.id.name} = { filename: "${data.fileName}" }`;
    dep = new ConstDependency(replacement, expr.range);
    dep.loc = expr.loc;
    this.state.current.addDependency(dep);
    // parse repl
    parseRepl(this.state.current.request, data);
  };

  // AST parser
  compiler.parser.plugin('var __svg__', analyzeAst);

  // save file to fs
  compiler.plugin('emit', (compilation, callback) => {
    async.forEach(Object.keys(tasks), (key, callback) => {
      async.forEach(tasks[key], (task, callback) => {
        utils.filesMap(path.join(task.context, task.path || ''), (files) => {
          // fileContent
          const fileContent = utils.createSprite(
            utils.parseFiles(files, options),
            options.template
          );

          // add sprite to assets
          compilation.assets[task.fileName] = {
            size: () => Buffer.byteLength(fileContent, 'utf8'),
            source: () => new Buffer(fileContent)
          };
          // done
          callback();
        });
      }, callback);
    }, callback);
  });

  compiler.plugin('done', () => {
    tasks = {};
  });
};


/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
