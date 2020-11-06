// Depends
const _ = require('lodash');
const path = require('path');
const utils = require('./helpers/utils');
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');
const NullFactory = require('webpack/lib/NullFactory');

// Defaults
const defaults = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    style: 'position:absolute; width: 0; height: 0'
  },
  svgoOptions: {},
  name: 'sprite.[hash].svg',
  prefix: 'icon-',
  template: path.join(__dirname, 'templates', 'layout.pug')
};

function compatAddPlugin(compiler, hookName, callback, async = false, forType = null) {
  const method = async ? 'tapPromise' : 'tap';
  if (compiler.hooks) {
    if (forType) {
      compiler.hooks[hookName][method](forType, WebpackSvgStore.name, callback);
    } else {
      compiler.hooks[hookName][method](WebpackSvgStore.name, callback);
    }
  } else {
    compiler.plugin(hookName, callback);
  }
}

const allowedMagicVariables = ['__svg__', '__sprite__', '__svgstore__', '__svgsprite__', '__webpack_svgstore__'];

class WebpackSvgStore {
  /**
   * Constructor
   * @param {object} options [description]
   * @return {object}
   */
  constructor(options) {
    this.tasks = {};
    this.options = _.merge({}, defaults, options);
  }

  addTask(file, value) {
    this.tasks[file]
      ? this.tasks[file].push(value)
      : (() => {
          this.tasks[file] = [];
          this.tasks[file].push(value);
        })();
  }

  createTaskContext({ init, id, range, loc }, { state }) {
    const data = {
      path: '/**/*.svg',
      fileName: '[hash].sprite.svg',
      context: state.current.context
    };

    init.properties.forEach(({ key, value }) => {
      switch (key.name) {
        case 'name':
          data.fileName = value.value;
          break;
        case 'path':
          data.path = value.value;
          break;
        default:
          break;
      }
    });

    const files = utils.filesMapSync(path.join(data.context, data.path || '').replace(/\\/g, '/'));

    data.fileContent = utils.createSprite(utils.parseFiles(files, this.options), this.options.template);
    data.fileName = utils.hash(data.fileName, utils.hashByString(data.fileContent));

    const replacement = `${id.name} = { filename: __webpack_require__.p +"${data.fileName}" }`;
    const dep = new ConstDependency(replacement, range);
    dep.loc = loc;
    state.current.addDependency(dep);
    // parse repl
    this.addTask(state.current.request, data);
  }

  apply(compiler) {
    // AST parser
    compatAddPlugin(compiler, 'compilation', (compilation, { normalModuleFactory }) => {
      compilation.dependencyFactories.set(ConstDependency, new NullFactory());
      compilation.dependencyTemplates.set(ConstDependency, new ConstDependency.Template());
      compatAddPlugin(
        normalModuleFactory,
        'parser',
        (parser) => {
          compatAddPlugin(parser, 'statement', ({ declarations }) => {
            if (!declarations || !declarations.length) return;
            const thisExpr = declarations[0];
            if (allowedMagicVariables.includes(thisExpr.id.name)) {
              return this.createTaskContext(thisExpr, parser);
            }
          });
        },
        false,
        'javascript/auto'
      );

      // save file to fs
      compatAddPlugin(
        compilation,
        'additionalAssets',
        () => {
          const taskKeysArr = Object.keys(this.tasks);
          if (taskKeysArr.length === 0) return Promise.resolve();
          else {
            return Promise.all(
              taskKeysArr.map(async (key) => {
                const tasksJobs = this.tasks[key];
                return Promise.all(
                  tasksJobs.map(async ({ fileName, fileContent }) => {
                    // add sprite to assets
                    compilation.assets[fileName] = {
                      size: () => Buffer.byteLength(fileContent, 'utf8'),
                      source: () => Buffer.from(fileContent)
                    };
                  })
                );
              })
            );
          }
        },
        true
      );

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
