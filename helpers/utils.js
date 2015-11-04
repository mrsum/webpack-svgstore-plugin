'use strict';

// Depends
var util = require('util');
var crypto = require('crypto');

/**
 * Depth log
 * @param  {[type]} subject [description]
 * @param  {[type]} depth   [description]
 * @return {[type]}         [description]
 */
var _log = function(subject, depth) {
  console.log(util.inspect(subject, {
    showHidden: true, depth: depth || 2
  }));
};

/**
 * Defs parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
module.exports.defs = function(id, dom, data) {

  return data;
};

/**
 * Symbols parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
module.exports.symbols = function(id, dom, data) {
  return data;
};

/**
 * Create hash
 * @param  {[type]} buffer [description]
 * @param  {[type]} name   [description]
 * @return {[type]}        [description]
 */
module.exports.hash = function(buffer, name) {
  return name.indexOf('[hash]') >= 0 ? name.replace('[hash]', crypto.createHash('md5').update(buffer).digest('hex')) : name;
};

/**
 * [log description]
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.log = _log;
