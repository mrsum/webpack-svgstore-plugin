'use strict';

// Depends
var plugin = require('../index');
var utils = require('../helpers/utils');

describe('utils.log', function() {
  it('function is exists', function(done) {
    if (typeof utils.log === 'function') done();
  });

  it('function is callable', function(done) {
    utils.log({ message: 'Hello from tests' }, 3);
    done();
  });
});


describe('utils.hash', function() {
  it('function is exists', function(done) {
    if (typeof utils.hash === 'function') done();
  });

  it('check hashsum #1', function(done) {
    var content = '<span>hello svg</span>';
    var fileName = '[hash].sprite.svg';
    if (utils.hash(content, fileName) === 'cdbf2bdb4f64b7f94b4779d2320918d9.sprite.svg') done();
  });

  it('check hashsum #2', function(done) {
    var content = '<span>hello svg</span>';
    var fileName = 'sprite.svg';
    if (utils.hash(content, fileName) === 'sprite.svg') done();
  });
});
