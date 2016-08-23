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
   * @param  {[type]}   unused [description]
   * @param  {Function} done   [description]
   * @return {[type]}          [description]
   */
  function run(unused, done) {
    function analyzeAst(resolve) {
      /**
       * Filing properties
       * @param  {[type]} expr [description]
       * @param  {[type]} data [description]
       * @return {[type]}      [description]
       */
      var fillProps = function(expr, props) {
        expr.init.properties.forEach(function(prop) {
          switch (prop.key.name) {
            case 'name': props.fileName = prop.value.value; break;
            case 'path': props.path = prop.value.value; break;
            default: break;
          }
        });

        props.state = this.state;
        props.context = this.state.current.context;

        return props;
      };

      /**
       * Filing tasks
       * @param  {[type]} expr [description]
       * @param  {[type]} data [description]
       * @return {[type]}      [description]
       */
      var fillTasks = function(expr, props) {
        var spriteFolder = path.join(props.context, props.path || '');
        utils.filesMap(spriteFolder, function(files) {
          var dep;
          var replacement;
          var fileName = props.fileName;
          var fileContent = utils.createSprite(
            utils.parseFiles(files, options),
            options.template
          );

          // check files in current folder
          files.length <= 0
            ? props.state.compilation.errors.push('No files in: ' + spriteFolder + ' folder')
            : null;

          // if filename has [hash]
          fileName.indexOf('[hash]') >= 0
            ? fileName = utils.hash(props.fileName, CRC32.bstr(fileContent))
            : null;

          replacement = expr.id.name + ' = { filename: "' + fileName + '" }';
          dep = new ConstDependency(replacement, expr.range);
          // put expression location
          dep.loc = expr.loc;
          // add task for replacement
          props.state.current.addDependency(dep);
          // push task for emit event
          tasks.push({ content: fileContent, name: fileName });
        });
      };

      resolve();

      return function(expr) {
        var props = {
          path: '/**/*.svg',
          fileName: '[hash].sprite.svg'
        };
        // fill data
        props = fillProps.bind(this)(expr, props);

        // fill tasks
        fillTasks.bind(this)(expr, props);

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
    new Promise(function(resolve) {
      resolve(tasks);
    })
    .each(function(file) {
      compilation.assets[file.name] = {
        size: function() { return Buffer.byteLength(file.content, 'utf8'); },
        source: function() { return new Buffer(file.content); }
      };
    })
    .then(function() {
      done();
    });
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
