'use strict';

// Depends
const filter = require('lodash/filter');
const path = require('path');
const util = require('util');
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
function _createSprite(data, template) {
  return pug.renderFile(template, data);
}

/**
 * Depth log
 * @param  {object}   subject Consolable object or array
 * @param  {integer}  depth   Depth level
 * @return {void}
 */
function _log(subject, depth) {
  console.log(util.inspect(subject, {
    showHidden: true, depth: depth || 2
  }));
}

/**
 * Fix ids
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
function _fixIds(obj, id) {
  // add id
  if (obj.attribs && obj.attribs.id) {
    obj.attribs.id = [id, obj.attribs.id].join('-');
  }
  // add id to use tag
  if (obj.name === 'use') {
    obj.attribs['xlink:href'] = ['#' + id, obj.attribs['xlink:href'].replace('#', '')].join('-');
  }
}

/**
 * Fix urls
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
function _fixUrls(obj, id) {
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
}

/**
 * Svg parser
 * @param  {Array} arr
 * @param  {String} id
 * @return {Array}
 */
function _parseSVG(arr, id) {
  const data = [];

  arr.forEach((obj) => {
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
}

/**
 * Defs parser
 * @param  {String} id      Current svg-file name
 * @param  {Object} dom     Dom model of file
 * @param  {Array}  data    Mutable data (result)
 * @return {Arry}
 */
function _defs(id, dom, data) {
  // lets find defs into dom
  const defs = filter(dom.children, { name: 'defs' });
  const parseChilds = function (item, data) {
    item.forEach((child) => {
      switch (child.name) {
        case 'use': {
          child.attribs['xlink:href'] = ['#' + id, child.attribs['xlink:href'].replace('#', '')].join('-');
        } break;
        default:
          child.attribs && child.attribs.id
            ? child.attribs.id = [id, child.attribs.id].join('-')
            : null;
      }

      if (child && child.children && child.children.length > 0) {
        data.push(child);
        parseChilds(child.children, data);
      }

      if (child && child.attribs && child.attribs.id) {
        data.push(child);
      }
    });
  };

  defs.forEach((item) => {
    if (item.children && item.children.length > 0) {
      parseChilds(item.children, data);
    }
  });

  return data;
}

/**
 * Symbols parser
 * @param  {String} id      Current svg-file name
 * @param  {Object} dom     Dom model of file
 * @param  {Array}  data    Mutable data (result)
 * @param {String} prefix  Prefix from config for each icon
 * @return {Array}
 */
function _symbols(id, dom, data, prefix) {
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
  symbol.children = filter(dom.children, (obj) => obj.name !== 'defs' && obj.name !== 'title');

  // go through the svg element
  _parseSVG(symbol.children, id);

  // push symbol data
  data.push(symbol);

  return data;
}

/**
 * Convert filename to id
 * @param  {string} filename [description]
 * @return {string}          [description]
 */
function _convertFilenameToId(filename) {
  return filename.split('.').join('-').toLowerCase();
}

/**
 * Build files map
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
function _filesMapSync(input) {
  return globby.sync(input);
}

/**
 * Parse dom objects
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
function _parseDomObject(data, filename, dom, prefix) {
  const id = _convertFilenameToId(filename);

  if (dom && dom[0]) {
    _defs(id, dom[0], data.defs);
    _symbols(id, dom[0], data.symbols, prefix);
  }

  return data;
}

/**
 * Minify via SVGO
 * @param  {string}   file  filename
 * @param  {integer}  loop  loop count
 * @return {[type]}         minified source
 */
function _minify(sourceFile, svgoOptions) {
  const min = new Svgo(svgoOptions);
  let resultFile;

  function svgoCallback(result) {
    resultFile = result.data;
  }

  min.optimize(sourceFile, svgoCallback);

  return resultFile;
}

/**
 * [parseFiles description]
 * @param  {Object} filesMap Map of fileName and its content
 * @return {Object} Data to render
 */
function _parseFiles(filesMap, options) {
  let data = {
    svg: options.svg,
    defs: [],
    symbols: []
  };

  // each over files
  Object.keys(filesMap).forEach((fullFileName) => {
    // load and minify
    const buffer = _minify(filesMap[fullFileName], options.svgoOptions);
    // get filename for id generation
    const fileName = path.basename(fullFileName, '.svg');
    const handler = new parse.DomHandler((error, dom) => {
      if (error) {
        this.log(error);
        return;
      }

      data = _parseDomObject(data, fileName, dom, options.prefix);
    });

    // lets create parser instance
    const Parser = new parse.Parser(handler, {
      xmlMode: true
    });
    Parser.write(buffer);
    Parser.end();
  });

  return data;
}

module.exports = {
  log: _log,
  parseFiles: _parseFiles,
  filesMapSync: _filesMapSync,
  parseDomObject: _parseDomObject,
  fixIds: _fixIds,
  fixUrls: _fixUrls,
  parseSVG: _parseSVG,
  convertFilenameToId: _convertFilenameToId,
  defs: _defs,
  symbols: _symbols,
  minify: _minify,
  createSprite: _createSprite
};
