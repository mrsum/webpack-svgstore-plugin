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

function compatAddPlugin(tappable, hookName, callback, async = false, forType = null) {
  const method = (async) ? 'tapPromise' : 'tap';
  if (tappable.hooks) {
    if (forType) {
      tappable.hooks[hookName][method](forType, WebpackSvgStore.name, callback);
    } else {
      tappable.hooks[hookName][method](WebpackSvgStore.name, callback);
    }
  } else {
    tappable.plugin(hookName, callback);
  }
}

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

  addTask(file, value) {
    this.tasks[file] ? this.tasks[file].push(value) : (() => {
      this.tasks[file] = [];
      this.tasks[file].push(value);
    })();
  }


  createTaskContext(expr, parser) {
    const data = {
      path: '/**/*.svg',
      fileName: '[hash].sprite.svg',
      context: parser.state.current.context
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
    compatAddPlugin(compiler, 'compilation', (compilation, data) => {
      compilation.dependencyFactories.set(ConstDependency, new NullFactory());
      compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
      compatAddPlugin(data.normalModuleFactory, 'parser', (parser) => {
        compatAddPlugin(parser, 'statement', (expr) => {
          if (!expr.declarations || !expr.declarations.length) return;
          const thisExpr = expr.declarations[0];
          if ([
            '__svg__',
            '__sprite__',
            '__svgstore__',
            '__svgsprite__',
            '__webpack_svgstore__'
          ].indexOf(thisExpr.id.name) > -1) {
            return this.createTaskContext(thisExpr, parser);
          }
        });
      }, false, 'javascript/auto');


      // save file to fs
      compatAddPlugin(compiler, 'emit', (compilation) => {
        return Promise.all(Object.keys(this.tasks).map(async (key) => {
          const tasksJobs = this.tasks[key];
          return Promise.all(tasksJobs.map(async task => {
            const glob = path.join(task.context, task.path || '');
            const files = await utils.filesMap(glob);
            const content = utils.parseFiles(files, this.options);
            const fileContent = utils.createSprite(content, this.options.template);
            // add sprite to assets
            compilation.assets[task.fileName] = {size: () => Buffer.byteLength(fileContent, 'utf8'), source: () => Buffer.from(fileContent)};
          }))
        }));
      }, true);

      compatAddPlugin(compiler, 'done', () => {
        this.tasks = {};
      });
    });
  }
}

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
