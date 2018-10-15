'use strict';

// Depends
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const util = require('util');
const crypto = require('crypto');
const pug = require('pug');
const Svgo = require('svgo');
const globby = require('globby');
const parse = require('htmlparser2');

/**
 * Create sprite
 * @param  {object} data
 * @param  {string} template
 * @return {string}
 */
const _createSprite = function(data, template) {
  return pug.renderFile(template, data);
};

/**
 * Depth log
 * @param  {object}   subject Consolable object or array
 * @param  {integer}  depth   Depth level
 * @return {void}
 */
const _log = function(subject, depth) {
  console.log(util.inspect(subject, {
    showHidden: true, depth: depth || 2
  }));
};

/**
 * Fix ids
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
const _fixIds = function(obj, id) {
  // add id
  if (obj.attribs && obj.attribs.id) {
    obj.attribs.id = [id, obj.attribs.id].join('-');
  }
  // add id to use tag
  if (obj.name === 'use') {
    obj.attribs['xlink:href'] = ['#' + id, obj.attribs['xlink:href'].replace('#', '')].join('-');
  }
};

/**
 * Fix urls
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
const _fixUrls = function(obj, id) {
  let key;
  let match;
  const json = obj.attribs;
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
const _parseSVG = function(arr, id) {
  const data = [];
  arr.forEach(function(obj) {
    if (obj) {
      // add unic ids to urls
      _fixUrls(obj, id);
      // add ids
      _fixIds(obj, id);
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
const _defs = function(id, dom, data) {
  // lets find defs into dom
  const defs = _.filter(dom.children, { name: 'defs' });
  const parseChilds = function(item, data) {
    item.forEach(function(child) {
      switch (child.name) {
        case 'use': {
          child.attribs['xlink:href'] = ['#' + id, child.attribs['xlink:href'].replace('#', '') ].join('-');
        } break;
        default:
          child.attribs && child.attribs.id
            ? child.attribs.id = [id, child.attribs.id].join('-')
            : null;
      }

      if (child && child.children && child.children.length > 0) {
        parseChilds(child.children, data);
      }

      if (child && child.attribs && child.attribs.id) {
        data.push(child);
      }
    });
  };

  defs.forEach(function(item) {
    if (item.children && item.children.length > 0) {
      parseChilds(item.children, data);
    }
  });

  return data;
};

/**
 * Symbols parser
 * @param  {[type]} id   [description]
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
const _symbols = function(id, dom, data, prefix) {
  // create symbol object
  const symbol = {
    type: 'tag',
    name: 'symbol',
    attribs: {
      viewBox: dom.attribs.viewBox,
      id: prefix + id
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
const _convertFilenameToId = function(filename) {
  return filename.split('.').join('-').toLowerCase();
};

/**
 * Build files map
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
const _filesMap = function(input, cb) {
  const data = input;

  globby(data).then(function(fileList) {
    cb(fileList);
  });
};

/**
 * Build files map sync
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
const _filesMapSync = function(input) {
  return globby.sync(input);
};

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
const _parseDomObject = function(data, filename, dom, prefix) {
  const id = _convertFilenameToId(filename);
  if (dom && dom[0]) {
    _defs(id, dom[0], data.defs);
    _symbols(id, dom[0], data.symbols, prefix);
  }

  return data;
};

/**
 * Minify via SVGO
 * @param  {string}   file  filename
 * @param  {integer}  loop  loop count
 * @return {[type]}         minified source
 */
const _minify = function(file, svgoOptions) {
  const min = new Svgo(svgoOptions);
  let source = file;

  function svgoCallback(result) {
    source = result.data;
  }

  min.optimize(source, svgoCallback);

  return source;
};

/**
 * [parseFiles description]
 * @return {[type]} [description]
 */
const _parseFiles = function(files, options) {
  const self = this;
  let data = {
    svg: options.svg,
    defs: [],
    symbols: []
  };

  // each over files
  files.forEach(function(file) {
    // load and minify
    const buffer = _minify(fs.readFileSync(file, 'utf8'), options.svgoOptions);
    // get filename for id generation
    const filename = path.basename(file, '.svg');

    const handler = new parse.DomHandler(function(error, dom) {
      if (error) self.log(error);
      else data = _parseDomObject(data, filename, dom, options.prefix);
    });

    // lets create parser instance
    const Parser = new parse.Parser(handler, {
      xmlMode: true
    });
    Parser.write(buffer);
    Parser.end();
  });

  return data;
};

/**
 * [_hash description]
 * @param  {[type]} buffer [description]
 * @param  {[type]} name   [description]
 * @return {[type]}        [description]
 */
const _hash = function(str, hash) {
  return str.indexOf('[hash]') >= 0
    ? str.replace('[hash]', hash)
    : str;
};

/**
 * [_hashByString description]
 * @param {string} str
 * @return {[type]} [description]
 */
const _hashByString = function(str) {
  const sha = crypto.createHash('md5');
  sha.update(str);
  
  return sha.digest('hex');
};

/**
 * Create hash
 * @param  {[type]} buffer [description]
 * @param  {[type]} name   [description]
 * @return {[type]}        [description]
 */
module.exports.hash = _hash;

/**
 * Create md5 hash by string
 * @param {string} str
 * @return {string} hash
 */
module.exports.hashByString = _hashByString;

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
 * Build files map
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
module.exports.filesMap = _filesMap;


/**
 * Build files map sync
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
module.exports.filesMapSync = _filesMapSync;

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
module.exports.parseDomObject = _parseDomObject;

/**
 * Fixing id inside each selector
 * @param  {[type]} subject [description]
 * @return {[type]}         [description]
 */
module.exports.fixIds = _fixIds;

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
