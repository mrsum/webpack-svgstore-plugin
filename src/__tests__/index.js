// Depends
const fs = require('fs');
const chai = require('chai');
const path = require('path');
const webpack = require('webpack');
const mocha = require('mocha');
const describe = mocha.describe;

const Plugin = require('../svgstore');
const utils = require('../helpers/utils');
const configPath = path.join(__dirname, '..', '..', 'webpack.config.js');
const config = require(configPath);

const rawFilePath = path.resolve(__dirname, './svg/test_svg.svg');
const compiledFilePath = path.resolve(__dirname, './svg/compiled_svg.svg');

/**
 * Run example
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
const runRelativePathsExample = function (done) {
  webpack(config, function () {
    done();
  });
};

/**
 * Side effect testing
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
const runAbsolutePathsExample = function (done) {
  const instance = new Plugin(
    path.join(__dirname, '..', 'svg-source', '**/*.svg'),
    path.join(__dirname, '..', 'sprites'),
    {
      name: 'issue51.[hash].sprite.svg',
      chunk: false, // if chunk is equal to false,
      prefix: 'icon-',
      svgoOptions: {}
    }
  );

  // @see https://github.com/mrsum/webpack-svgstore-plugin/issues/51
  // replace plugin config
  config.plugins = [instance];

  webpack(config, function () {
    done();
  });
};

describe('utils.log', function () {
  const assert = chai.assert;

  it('function is exists', function () {
    assert.typeOf(utils.log, 'function');
  });

  it('function is callable', function (done) {
    utils.log({ message: 'Hello from tests' }, 3);
    done();
  });
});

describe('utils.hash', function () {
  const assert = chai.assert;
  it('function is exists', function () {
    assert.typeOf(utils.hash, 'function');
  });

  it('check hashsum #1', function () {
    // var content = '<span>hello svg</span>';
    assert.equal(
      utils.hash('[hash].sprite.svg', 'cdbf2bdb4f64b7f94b4779d2320918d9'),
      'cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg'
    );
  });

  // it('check hashsum #2', function() {
  //   var content = '<span>hello svg</span>';
  //   var fileName = 'sprite.svg';
  //   assert.equal(utils.hash(content, fileName), 'sprite.svg');
  // });
});

describe('utils.symbols', function () {
  const assert = chai.assert;
  it('function is exists', function () {
    assert.typeOf(utils.symbols, 'function');
  });
});

describe('utils.createSprite', function () {
  const arr = [];
  const assert = chai.assert;
  const output = fs.readFileSync(compiledFilePath, 'utf-8');
  const options = {
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
  let source;

  arr.push(rawFilePath);

  source = utils.createSprite(utils.parseFiles(arr, options), options.template);

  it('check full sprite creation', function (done) {
    done();
    // assert.equal(source, output);
  });
});

describe('utils.filesMapSync', function () {
  const assert = chai.assert;

  it('should contain filesMapSync function', function () {
    assert.typeOf(utils.filesMapSync, 'function');
  });

  it('should callback filesMapSync function', function () {
    const items = utils.filesMapSync(path.join(__dirname, 'svg', '**', '*.svg'));
    assert.isArray(items);
    assert(items.length > 0, 'Files array must be more than 0');
  });
});

describe('utils.convertFilenameToId', function () {
  const assert = chai.assert;
  it('function is exists', function () {
    assert.typeOf(utils.convertFilenameToId, 'function');
  });

  it('check function result #1 sprite.svg', function () {
    assert.equal(utils.convertFilenameToId('sprite.svg'), 'sprite-svg');
  });

  it('check function result #1 cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg', function () {
    assert.equal(
      utils.convertFilenameToId('cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg'),
      'cdbf2bdb4f64b7f94b4779d2320918d9-sprite-svg'
    );
  });
});

describe('plugin.WebpackSvgStore static functions', function () {
  let WebpackSvgStore;
  const assert = chai.assert;

  it('function is exists', function () {
    assert.typeOf(Plugin, 'function');
  });

  it('try to create new object', function () {
    WebpackSvgStore = new Plugin();
  });

  it('should be an object', function () {
    assert.typeOf(WebpackSvgStore, 'object');
  });

  it('should contain apply function', function () {
    assert.typeOf(WebpackSvgStore.apply, 'function');
  });
});

describe('plugin.WebpackSvgStore', function () {
  it('should run without errors', function (done) {
    runRelativePathsExample(done);
  });
});

describe('plugin.WebpackSvgStore side effect testing: issue-51', function () {
  it('should run without errors', function (done) {
    runAbsolutePathsExample(done);
  });
});
