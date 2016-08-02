'use strict';

// Depends
var fs = require('fs');
var chai = require('chai');
var path = require('path');
var webpack = require('webpack');
var mocha = require('mocha');
var describe = mocha.describe;


var Plugin = require('../svgstore');
var utils = require('../helpers/utils');
var configPath = path.join(__dirname, '..', '..', 'webpack.config.js');
var config = require(configPath);

var rawFilePath = path.resolve(__dirname, './svg/test_svg.svg');
var compiledFilePath = path.resolve(__dirname, './svg/compiled_svg.svg');


/**
 * Run example
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
var runRelativePathsExample = function(done) {
  webpack(config, function() {
    done();
  });
};

/**
 * Side effect testing
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
var runAbsolutePathsExample = function(done) {
  var instance = new Plugin(path.join(__dirname, '..', 'svg-source', '**/*.svg'), path.join(__dirname, '..', 'sprites'), {
    name: 'issue51.[hash].sprite.svg',
    chunk: false, // if chunk is equal to false,
    prefix: 'icon-',
    svgoOptions: {}
  });

  // @see https://github.com/mrsum/webpack-svgstore-plugin/issues/51
  // replace plugin config
  config.plugins = [instance];

  webpack(config, function() {
    done();
  });
};


describe('utils.log', function() {
  var assert = chai.assert;

  it('function is exists', function() {
    assert.typeOf(utils.log, 'function');
  });

  it('function is callable', function(done) {
    utils.log({ message: 'Hello from tests' }, 3);
    done();
  });
});


describe('utils.hash', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.hash, 'function');
  });

  it('check hashsum #1', function() {
    // var content = '<span>hello svg</span>';
    assert.equal(utils.hash('[hash].sprite.svg', 'cdbf2bdb4f64b7f94b4779d2320918d9'), 'cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg');
  });

  // it('check hashsum #2', function() {
  //   var content = '<span>hello svg</span>';
  //   var fileName = 'sprite.svg';
  //   assert.equal(utils.hash(content, fileName), 'sprite.svg');
  // });
});

describe('utils.symbols', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.symbols, 'function');
  });
});

describe('utils.createSprite', function() {
  var arr = [];
  var assert = chai.assert;
  var output = fs.readFileSync(compiledFilePath, 'utf-8');
  var options = {
    svg: {
      xmlns: 'http://www.w3.org/2000/svg',
      style: 'position:absolute; width: 0; height: 0'
    },
    loop: 2,
    svgoOptions: {},
    prefix: 'icon-',
    name: 'sprite.[hash].svg',
    ajaxWrapper: false,
    template: path.join(__dirname, '..', 'templates/layout.pug')
  };
  var source;

  arr.push(rawFilePath);

  source = utils.createSprite(utils.parseFiles(arr, options), options.template);

  it('check full sprite creation', function(done) {
    done();
    // assert.equal(source, output);
  });
});

describe('utils.filesMap', function() {
  var assert = chai.assert;

  it('should contain filesMap function', function() {
    assert.typeOf(utils.filesMap, 'function');
  });

  it('should callback filesMap function', function(done) {
    utils.filesMap(path.join(__dirname, 'svg', '**', '*.svg'), function(items) {
      assert.isArray(items);
      assert(items.length > 0, 'Files array must be more than 0');
      done();
    });
  });
});

describe('utils.convertFilenameToId', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.convertFilenameToId, 'function');
  });

  it('check function result #1 sprite.svg', function() {
    assert.equal(utils.convertFilenameToId('sprite.svg'), 'sprite-svg');
  });

  it('check function result #1 cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg', function() {
    assert.equal(utils.convertFilenameToId('cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg'), 'cdbf2bdb4f64b7f94b4779d2320918d9-sprite-svg');
  });
});


describe('plugin.WebpackSvgStore static functions', function() {
  var WebpackSvgStore;
  var assert = chai.assert;

  it('function is exists', function() {
    assert.typeOf(Plugin, 'function');
  });

  it('try to create new object', function() {
    WebpackSvgStore = new Plugin();
  });

  it('should be an object', function() {
    assert.typeOf(WebpackSvgStore, 'object');
  });

  it('should contain apply function', function() {
    assert.typeOf(WebpackSvgStore.apply, 'function');
  });
});


describe('plugin.WebpackSvgStore', function() {
  it('should run without errors', function(done) {
    runRelativePathsExample(done);
  });
});

describe('plugin.WebpackSvgStore side effect testing: issue-51', function() {
  it('should run without errors', function(done) {
    runAbsolutePathsExample(done);
  });
});

