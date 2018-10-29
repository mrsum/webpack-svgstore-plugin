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

const allowedMagicVariables = [
  '__svg__',
  '__sprite__',
  '__svgstore__',
  '__svgsprite__',
  '__webpack_svgstore__'
];

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

    const files = utils.filesMapSync(path.join(data.context, data.path || ''));

    data.fileContent = utils.createSprite(utils.parseFiles(files, this.options), this.options.template);
    data.fileName = utils.hash(data.fileName, utils.hashByString(data.fileContent));

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
          if (allowedMagicVariables.indexOf(thisExpr.id.name) > -1) {
            return this.createTaskContext(thisExpr, parser);
          }
        });
      }, false, 'javascript/auto');

      // save file to fs
      compatAddPlugin(compilation, 'additionalAssets', () => {
        const taskKeysArr = Object.keys(this.tasks);
        if (taskKeysArr.length === 0) return Promise.resolve();
        else {
          return Promise.all(taskKeysArr.map(async (key) => {
            const tasksJobs = this.tasks[key];
            return Promise.all(tasksJobs.map(async task => {
              // add sprite to assets
              compilation.assets[task.fileName] = {
                size: () => Buffer.byteLength(task.fileContent, 'utf8'),
                source: () => Buffer.from(task.fileContent)
              };
            }))
          }));
        }
      }, true);

      compatAddPlugin(compilation, 'afterSeal', () => {
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
