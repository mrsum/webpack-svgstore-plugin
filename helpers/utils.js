'use strict';

// Depends
var _ = require('lodash');
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
  // lets find defs into dom
  var defs = _.findWhere(dom.children, { name: 'defs' });
  // check childrens
  if (defs && defs.children && defs.children.length > 0) {
    // mutable attribute
    defs.children.forEach(function(_data, _key) {
      defs.children[_key].attribs.id = [id, _data.attribs.id || 'id'].join('-');
      data.push(defs.children[_key]);
    });
  }

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
