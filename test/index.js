'use strict';

// Depends
var fs = require('fs');
var chai = require('chai');
var path = require('path');
var webpack = require('webpack');
var mocha = require('mocha');
var Plugin = require('../index');
var utils = require('../helpers/utils');
var configPath = path.join(__dirname,'..', 'webpack.config.js');
var config = require(configPath);


/**
 * Run example
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
var runExample = function(done) {
  webpack(config, function() {
    done();
  });
};

/**
 * Side effect testing
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
var runSideEffectExample = function(done) {

  var instance = new Plugin(path.join(__dirname, 'svg-source', '**/*.svg'), path.join('sprites'), {
    name: '[hash].sprite.svg',
    chunk: 'app',
    prefix: 'icon-',
    svgoOptions: {}
  });

  // @see https://github.com/mrsum/webpack-svgstore-plugin/issues/51
  var pluginConfigSection = [instance];

  // replace plugin config
  config.plugins = pluginConfigSection;

  webpack(config, function(log) {
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
    var content = '<span>hello svg</span>';
    var fileName = '[hash].sprite.svg';

    assert.equal(utils.hash(content, fileName), 'cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg');
  });

  it('check hashsum #2', function() {
    var content = '<span>hello svg</span>';
    var fileName = 'sprite.svg';
    assert.equal(utils.hash(content, fileName), 'sprite.svg');
  });
});

describe('utils.symbols', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.symbols, 'function');
  });
});

describe('utils.createSprite', function() {
  var assert = chai.assert;
  var arr = [];
  var output = fs.readFileSync('./test/svg/compiled_svg.svg', 'utf-8');
  var options = {
    svg: {
      xmlns: 'http://www.w3.org/2000/svg',
      style: 'position:absolute; width: 0; height: 0'
    },
    loop: 2,
    svgoOptions: {},
    prefix: 'icon-',
    name: 'sprite.[hash].svg',
    ajaxWrapper: false
  };
  var source;

  arr.push(path.join(__dirname, 'svg', 'test_svg.svg'));

  source = utils.createSprite(utils.parseFiles(arr, options));

  it('check full sprite creation', function() {
    assert.equal(source, output);
  });
});

describe('utils.convertFilenameToId', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.convertFilenameToId, 'function');
  });

  it('check function result #1 sprite.svg', function() {
    assert.equal(utils.convertFilenameToId('sprite.svg'), 'sprite');
  });

  it('check function result #1 cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg', function() {
    assert.equal(utils.convertFilenameToId('cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg'), 'cdbf2bdb4f64b7f94b4779d2320918d9');
  });
});

describe('utils.prepareFolder', function() {
  var assert = chai.assert;
  it('function is exists', function() {
    assert.typeOf(utils.prepareFolder, 'function');
  });

  it('function create folder', function() {
    assert.equal(utils.prepareFolder('test_folder'), true);
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

  it('should contain filesMap function', function() {
    assert.typeOf(WebpackSvgStore.filesMap, 'function');
  });

  it('should callback filesMap function', function(done) {
    WebpackSvgStore.filesMap(path.join(__dirname, '..', 'platform', '**', '*.svg'), function(items) {
      assert.isArray(items);
      assert(items.length > 0, 'Files array must be more than 0');
      done();
    });
  });

  it('should contain apply function', function() {
    assert.typeOf(WebpackSvgStore.apply, 'function');
  });
});


describe('plugin.WebpackSvgStore', function() {
  it('should run without errors', function(done) {
    runExample(done);
  })
});

describe('plugin.WebpackSvgStore side effect testing', function() {
  it('should run without errors', function(done) {
    runSideEffectExample(done);
  })
});


