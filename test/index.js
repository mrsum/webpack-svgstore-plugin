'use strict';

// Depends
var plugin = require('../index');
var utils = require('../helpers/utils');

describe('WebpackSvgStore', function() {
  describe('utils.log', function() {
    it('should run without error', function(done) {
      utils.log('logo-phone');
      done();
    });
  });
});
