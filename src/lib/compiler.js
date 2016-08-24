'use strict';

// Depends
var tasks = [];
var path = require('path');
var CRC32 = require('crc-32');
var utils = require('./utils');
var globby = require('globby');
var Promise = require('bluebird');
var ConstDependency = require('webpack/lib/dependencies/ConstDependency');

/**
 * [analyzeAst description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
var analyzeAst = function(options) {
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
    props.options = options;

    return props;
  };

  /**
   * Sprite creating function
   * @param  {[type]} expr    [description]
   * @param  {[type]} props   [description]
   * @param  {[type]} resolve [description]
   * @return {[type]}         [description]
   */
  var fillTasks = function(expr, props, resolve) {
    var spriteFolder = path.join(props.context, props.path || '');
    globby(spriteFolder)
      .then(function(files) {
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

        //
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
        resolve({ content: fileContent, name: fileName });
      });
  };

  return function(expr) {
    var props = {
      path: '/**/*.svg',
      fileName: '[hash].sprite.svg',
      folder: null
    };

    return new Promise(function(resolve) {
      props = fillProps.bind(this)(expr, props);
      fillTasks(expr, props, resolve);
    }.bind(this))
      .then(function(task) {
        tasks.push(task);
      });
  };
};

/**
 * Child Compiler
 * @param {object} compilation   [description]
 * @param {object} context       [description]
 * @param {object} outputOptions [description]
 */
var ChildCompiler = function(compilation, context, outputOptions, pluginOptions) {
  var childCompilerInstance = compilation.createChildCompiler('webpack-svgstore-plugin', outputOptions);

  // set childCompiler context
  childCompilerInstance.context = context;

  compilation.compiler.plugin('emit', function(compilation, done) {
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

  // Compile and return a promise
  return new Promise(function(resolve, reject) {
    // subscribe at parser results
    childCompilerInstance.parser.plugin('var __svg__', analyzeAst(pluginOptions));
    childCompilerInstance.parser.plugin('var __sprite__', analyzeAst(pluginOptions));
    childCompilerInstance.parser.plugin('var __svgstore__', analyzeAst(pluginOptions));
    childCompilerInstance.parser.plugin('var __svgsprite__', analyzeAst(pluginOptions));
    childCompilerInstance.parser.plugin('var __webpack_svgstore__', analyzeAst(pluginOptions));

    childCompilerInstance.runAsChild(function(err, entries, childCompilation) {
      // compilation has errors
      childCompilation && childCompilation.errors && childCompilation.errors.length
        ? reject()
        : null;

      // catch error
      err ? reject(err) : null;

      resolve();
    });
  });
};

module.exports = ChildCompiler;
