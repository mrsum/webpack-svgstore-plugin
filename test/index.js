'use strict';

// Depends
var chai = require('chai');
var mocha = require('mocha');
var plugin = require('../index');
var utils = require('../helpers/utils');

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
