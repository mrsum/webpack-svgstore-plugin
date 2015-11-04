'use strict';

// Depends
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var util = require('util');
var Svgo = require('svgo');
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
    defs.children.forEach(function(_data) {
      _data.attribs.id = [id, _data.attribs.id || 'icon-id'].join('-');
      data.push(_data);
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
  // create symbol object
  var symbol = {
    type: 'tag',
    name: 'symbol',
    attribs: {
      viewbox: dom.attribs.viewbox,
      id: id
    },
    next: null,
    prev: null,
    parent: null
  };

  // add dom children without defs and titles
  symbol.children = _.filter(dom.children, function(obj) {
    return obj.name !== 'defs' && obj.name !== 'title';
  });

  data.push(symbol);

  return data;
};

/**
 * Check folder
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
module.exports.prepareFolder = function(folder) {
  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Minify via SVGO
 * @param  {string}   file  filename
 * @param  {integer}  loop  loop count
 * @return {[type]}         minified source
 */
module.exports.minify = function(file, loop) {
  var i;
  var minify = new Svgo();
  var source = file;

  function svgoCallback(result) {
    source = result.data;
  }

  // optimize loop
  for (i = 1; i <= loop; i++) {
    minify.optimize(source, svgoCallback);
  }

  return source;
};

/**
 * Prepare svgXHR function
 * @param  {[type]} sprites [description]
 * @return {[type]}         [description]
 */
module.exports.svgXHR = function(filename) {
  var wrapper = fs.readFileSync(path.join(__dirname, 'svgxhr.js'), 'utf-8');
  wrapper += 'svgXHR(\'' + filename + '\');';
  return wrapper;
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
