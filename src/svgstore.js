'use strict';

// Defaults
const defaults = {
  svg: {
    xmlns: 'http://www.w3.org/2000/svg',
    'xmlns:xlink': "http://www.w3.org/1999/xlink",
    style: 'position:absolute; width:0; height:0'
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
const fs = require('fs');
const crypto = require('crypto');

class WebpackSvgStore {

  /**
   * Constructor
   * @param {object} options [description]
   * @return {object}
   */
  constructor(options) {
    this.options = _.merge({}, defaults, options);
    this.svgFilesMap = {};
    this.generatedFileName = '';
  };

  analyzeAst() {
    let self = this;
    return function (expr) {
      const buildData = {
        path: self.options.path,
        fileName: self.options.fileName,
        context: this.state.current.context
      };

      // Create SVG-files map [filename: its content] and generate hash for result sprite-file name
      const svgFileNames = utils.filesMapSync(path.join(buildData.context, buildData.path || ''));
      const svgFilesContent = svgFileNames.reduce(function (accContent, fileName) {
        const fileContent = fs.readFileSync(fileName, 'utf8');
        self.svgFilesMap[fileName] = fileContent;
        accContent += fileContent;
        return accContent;
      }, '');
      const hash = crypto.createHash('md5').update(svgFilesContent).digest('hex').substr(0, 15);

      self.generatedFileName = utils.hash(buildData.fileName, hash);
      const replacement = `${expr.name} = "${self.generatedFileName}"`;
      const dep = new ConstDependency(replacement, expr.range);

      dep.loc = expr.loc;
      this.state.current.addDependency(dep);
    };
  }

  apply(compiler) {
    // AST parser
    compiler.plugin('compilation', (compilation, data) => {
      const analzyerFunc = this.analyzeAst();

      data.normalModuleFactory.plugin('parser', (parser) => {
        parser.plugin('var __svg__', analzyerFunc);
      })
    });


    // save file to fs
    compiler.plugin('emit', (compilation, callback) => {
      const fileContent = utils.createSprite(
        utils.parseFiles(this.svgFilesMap, this.options),
        this.options.template
      );

      // add sprite to assets
      compilation.assets[this.generatedFileName] = {
        size: function () {
          return Buffer.byteLength(fileContent, 'utf8');
        },
        source: function () {
          return new Buffer(fileContent);
        }
      };

      callback();
    });
  }
}


/**
 * Return function
 * @type {[type]}
 */
module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
