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
var Promise = require('bluebird');
var utils = require('./helpers/utils');
var CRC32 = require('crc-32');
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
  var tasks = [];
  var options = this.options;

  /**
   * [onRun description]
   * @param  {[type]}   unused [description]
   * @param  {Function} done   [description]
   * @return {[type]}          [description]
   */
  function run(unused, done) {
    function analyzeAst(resolve) {
      var data = {
        path: '/**/*.svg',
        fileName: '[hash].sprite.svg'
      };

      /**
       * Filing properties
       * @param  {[type]} expr [description]
       * @param  {[type]} data [description]
       * @return {[type]}      [description]
       */
      var fillProps = function(expr, data) {
        expr.init.properties.forEach(function(prop) {
          switch (prop.key.name) {
            case 'name': data.fileName = prop.value.value; break;
            case 'path': data.path = prop.value.value; break;
            default: break;
          }
        });

        data.state = this.state;
        data.context = this.state.current.context;

        return data;
      };

      /**
       * Filing tasks
       * @param  {[type]} expr [description]
       * @param  {[type]} data [description]
       * @return {[type]}      [description]
       */
      var fillTasks = function(expr, data) {
        utils.filesMap(path.join(data.context, data.path || ''), function(files) {
          var fileContent = utils.createSprite(
            utils.parseFiles(files, options),
            options.template
          );
          var fileName = utils.hash(data.fileName, CRC32.bstr(fileContent));
          var replacement = expr.id.name + ' = { filename: "' + fileName + '" }';
          var dep = new ConstDependency(replacement, expr.range);
          dep.loc = expr.loc;
          data.state.current.addDependency(dep);

          tasks.push({ content: fileContent, name: fileName });
        });
      };

      resolve();

      return function(expr) {
        data = fillProps.bind(this)(expr, data);
        fillTasks.bind(this)(expr, data);
        return true;
      };
    }

    /**
     * Wrap in promise for long timing actions
     */
    new Promise(function(resolve) {
      compiler.parser.plugin('var __svg__', analyzeAst(resolve));
      compiler.parser.plugin('var __sprite__', analyzeAst(resolve));
      compiler.parser.plugin('var __svgstore__', analyzeAst(resolve));
      compiler.parser.plugin('var __svgsprite__', analyzeAst(resolve));
      compiler.parser.plugin('var __webpack_svgstore__', analyzeAst(resolve));
    })
    .then(function() {
      done();
    });
  }

  compiler.plugin('run', run);
  compiler.plugin('watch-run', run);

  compiler.plugin('emit', function(compilation, done) {
    tasks.forEach(function(file) {
      // add sprite to assets
      compilation.assets[file.name] = {
        size: function() { return Buffer.byteLength(file.content, 'utf8'); },
        source: function() { return new Buffer(file.content); }
      };
    });
    done();
  });

  compiler.plugin('done', function() {
    tasks = [];
  });
};

/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
