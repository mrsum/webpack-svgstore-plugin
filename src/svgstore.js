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
var childCompiler = require('./lib/compiler');

/**
 * WebpackSvgStore
 * @param {object} options
 */
var WebpackSvgStore = function(options) {
  this.options = Object.assign({}, _options, options);
  return this;
};

/**
 *
 * @param  {object} compiler
 * @return {[type]}
 */
WebpackSvgStore.prototype.apply = function(compiler) {
  var options = this.options;
  compiler.plugin('make', function(compilation, callback) {
    childCompiler(compilation, compiler.context, compiler.options.output, options)
      .then(function() {
        callback();
      });
  });
};

module.exports = WebpackSvgStore;
module.exports.Options = WebpackSvgStore;
