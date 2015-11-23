'use strict';

// Depends
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var util = require('util');
var jade = require('jade');
var Svgo = require('svgo');
var crypto = require('crypto');
var parse = require('htmlparser2');

/**
 * Create sprite
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
var _createSprite = function(data) {
  return jade.renderFile(path.join(__dirname, '../templates', 'layout.jade'), data);
};

/**
 * Depth log
 * @param  {object}   subject Consolable object or array
 * @param  {integer}  depth   Depth level
 * @return {void}
 */
var _log = function(subject, depth) {
  console.log(util.inspect(subject, {
    showHidden: true, depth: depth || 2
  }));
};

/**
 * Fix masks
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
var _fixMasks = function(obj, id) {
  // add id to mask
  if (obj.name === 'mask') {
    obj.attribs.id = [id, obj.attribs.id].join('-');
  }
  // add id to use tag inside mask
  if (obj.name === 'use' && obj.parent.name === 'mask') {
    obj.attribs['xlink:href'] = ['#' + id, obj.attribs['xlink:href'].replace('#', '')].join('-');
  }
};

/**
 * Fix urls
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
var _fixUrls = function(obj, id) {
  var key;
  var match;
  var json = obj.attribs;
  if (json) {
    for (key in json) {
      if (json.hasOwnProperty(key)) {
        match = /url\(\s*#([^ ]+?)\s*\)/g.exec(json[key]);
        if (key && match) {
          json[key] = 'url(#' + id + '-' + match[1] + ')';
        }
      }
    }
  }
};

/**
 * Svg parser
 * @param  {[type]} arr   [description]
 * @param  {[type]} id    [description]
 * @return {[type]}       [description]
 */
var _parseSVG = function(arr, id) {
  var data = [];
  arr.forEach(function(obj) {
    if (obj) {
      // add unic ids to urls
      _fixUrls(obj, id);
      // add ids to each mask
      _fixMasks(obj, id);
      // go deeper if children exists
      if (obj.children && obj.children.length > 0) {
        _parseSVG(obj.children, id);
      }
      data.push(obj, id);
    }
  });

  return data;
};

/**
 * Defs parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
var _defs = function(id, dom, data) {
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
var _symbols = function(id, dom, data) {
  // create symbol object
  var symbol = {
    type: 'tag',
    name: 'symbol',
    attribs: {
      viewbox: dom.attribs.viewbox,
      id: 'icon-' + id
    },
    next: null,
    prev: null,
    parent: null
  };

  // add dom children without defs and titles
  symbol.children = _.filter(dom.children, function(obj) {
    return obj.name !== 'defs' && obj.name !== 'title';
  });

  // go through the svg element
  _parseSVG(symbol.children, id);

  // push symbol data
  data.push(symbol);

  return data;
};

/**
 * Convert filename to id
 * @param  {string} filename [description]
 * @return {string}          [description]
 */
var _convertFilenameToId = function(filename) {
  var _name = filename;
  var dotPos = filename.indexOf('.');
  if (dotPos > -1) {
    _name = filename.substring(0, dotPos);
  }
  return _name;
};

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
var _parseDomObject = function(data, filename, dom) {
  var id = _convertFilenameToId(filename);
  if (dom && dom[0]) {
    _defs(id, dom[0], data.defs);
    _symbols(id, dom[0], data.symbols);
  }

  return data;
};

/**
 * Minify via SVGO
 * @param  {string}   file  filename
 * @param  {integer}  loop  loop count
 * @return {[type]}         minified source
 */
var _minify = function(file, loop, svgoOptions) {
  var i;
  var min = new Svgo(svgoOptions);
  var source = file;

  function svgoCallback(result) {
    source = result.data;
  }

  // optimize loop
  for (i = 1; i <= loop; i++) {
    min.optimize(source, svgoCallback);
  }

  return source;
};

/**
 * [parseFiles description]
 * @return {[type]} [description]
 */
var _parseFiles = function(files, options) {
  var self = this;
  var data = {
    svg: options.svg,
    defs: [],
    symbols: []
  };

  // each over files
  files.forEach(function(file) {
    // load and minify
    var buffer = _minify(fs.readFileSync(file, 'utf8'), options.loop, options.svgoOptions);
    // get filename for id generation
    var filename = path.basename(file, '.svg');
    var handler = new parse.DomHandler(function(error, dom) {
      if (error) self.log(error);
      else data = _parseDomObject(data, filename, dom);
    });

    // lets create parser instance
    var Parser = new parse.Parser(handler);
    Parser.write(buffer);
    Parser.end();
  });

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
 * Deep log util
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.log = _log;

/**
 * Parse file with htmlparser
 * @return {[type]} [description]
 */
module.exports.parseFiles = _parseFiles;

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
module.exports.parseDomObject = _parseDomObject;

/**
 * Fixing id inside each mask selector
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.fixMasks = _fixMasks;

/**
 * Fixing url inside each svg
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.fixUrls = _fixUrls;

/**
 * Simple SVG parser
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.parseSVG = _parseSVG;

/**
 * [convertFilenameToId description]
 * @type {[type]}
 */
module.exports.convertFilenameToId = _convertFilenameToId;

/**
 * Defs parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
module.exports.defs = _defs;

/**
 * Symbols parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
module.exports.symbols = _symbols;

/**
 * Minify via SVGO
 * @param  {string}   file  filename
 * @param  {integer}  loop  loop count
 * @return {[type]}         minified source
 */
module.exports.minify = _minify;

/**
 * Sprite creation
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
module.exports.createSprite = _createSprite;

