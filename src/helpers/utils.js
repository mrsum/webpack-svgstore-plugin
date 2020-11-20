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
const _createSprite = (data, template) => pug.renderFile(template, data);

/**
 * Depth log
 * @param  {object}   subject Consolable object or array
 * @param  {number}  depth   Depth level
 * @return {void}
 */
const _log = (subject, depth) => {
  // eslint-disable-next-line no-console
  console.log(
    util.inspect(subject, {
      showHidden: true,
      depth: depth || 2
    })
  );
};

/**
 * Fix ids
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
const _fixIds = ({ attribs, name }, id) => {
  // add id
  if (attribs && attribs.id) {
    attribs.id = [id, attribs.id].join('-');
  }
  // add id to use tag
  if (name === 'use') {
    attribs['xlink:href'] = [`#${id}`, attribs['xlink:href'].replace('#', '')].join('-');
  }
};

/**
 * Fix urls
 * @param  {object} obj
 * @param  {string} id
 * @return {void}
 */
const _fixUrls = ({ attribs }, id) => {
  let key;
  let match;
  const json = attribs;
  if (json) {
    for (key in json) {
      // eslint-disable-next-line no-prototype-builtins
      if (json.hasOwnProperty(key)) {
        match = /url\(\s*#([^ ]+?)\s*\)/g.exec(json[key]);
        if (key && match) {
          json[key] = `url(#${id}-${match[1]})`;
        }
      }
    }
  }
};

/**
 * Svg parser
 * @param  {array} arr   [description]
 * @param  {string} id    [description]
 * @return {[type]}       [description]
 */
const _parseSVG = (arr, id) => {
  arr.forEach((obj) => {
    if (obj) {
      // add unique ids to urls
      _fixUrls(obj, id);
      // add ids
      _fixIds(obj, id);
      // go deeper if children exists
      if (obj.children && obj.children.length > 0) {
        _parseSVG(obj.children, id);
      }
    }
  });
};

/**
 * Defs parser
 * @param  {string} id   [description]
 * @param {object} children
 * @param  {array} data [description]
 * @return {array}      [description]
 */
const _defs = (id, { children }, data) => {
  // lets find defs into dom
  const defs = _.filter(children, { name: 'defs' });
  const parseChildItems = (item, data) => {
    item.forEach((child) => {
      switch (child.name) {
        case 'use':
          child.attribs['xlink:href'] = [`#${id}`, child.attribs['xlink:href'].replace('#', '')].join('-');

          break;
        default:
          // eslint-disable-next-line no-unused-expressions
          child.attribs && child.attribs.id ? (child.attribs.id = [id, child.attribs.id].join('-')) : null;
      }

      if (child && child.children && child.children.length > 0) {
        parseChildItems(child.children, data);
      }

      if (child && child.attribs && child.attribs.id) {
        data.push(child);
      }
    });
  };

  defs.forEach(({ children }) => {
    if (children && children.length > 0) {
      parseChildItems(children, data);
    }
  });

  return data;
};

/**
 * Symbols parser
 * @param  {string} id   [description]
 * @param attribs
 * @param children
 * @param  {array} data [description]
 * @param prefix
 * @return {[type]}      [description]
 */
const _symbols = (id, { attribs, children }, data, prefix) => {
  // create symbol object
  const symbol = {
    type: 'tag',
    name: 'symbol',
    attribs: {
      viewBox: attribs ? attribs.viewBox : null,
      id: prefix + id
    },
    next: null,
    prev: null,
    parent: null
  };

  // add dom children without defs and titles
  symbol.children = _.filter(children, ({ name }) => name !== 'defs' && name !== 'title');

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
const _convertFilenameToId = (filename) => filename.split('.').join('-').toLowerCase();

/**
 * Parse dom objects
 * @param data
 * @param filename
 * @param  {array} dom [description]
 * @param prefix
 * @return {object}     [description]
 */
const _parseDomObject = (data, filename, dom, prefix) => {
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
 * @param svgoOptions
 * @return {string}         minified source
 */
const _minify = (file, svgoOptions) => {
  const min = new Svgo(svgoOptions);
  let source = file;

  function svgoCallback({ data }) {
    source = data;
  }

  // TODO find out why we do not use promise here
  // Promise has appeared since version 1.0.0, in version 0.7.1 it works fine
  min.optimize(source, svgoCallback);

  return source;
};

/**
 * [parseFiles description]
 * @return {object} [description]
 */
const _parseFiles = function (files, { svg, svgoOptions, prefix }) {
  const self = this;
  let data = {
    svg,
    defs: [],
    symbols: []
  };

  // each over files
  files.forEach((file) => {
    // load and minify
    const buffer = _minify(fs.readFileSync(file, 'utf8'), svgoOptions);
    // get filename for id generation
    const filename = path.basename(file, '.svg');

    const handler = new parse.DomHandler((error, dom) => {
      if (error) self.log(error);
      else data = _parseDomObject(data, filename, dom, prefix);
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
 * @return {[type]}        [description]
 * @param str
 * @param hash
 */
const _hash = (str, hash) => (str.includes('[hash]') ? str.replace('[hash]', hash) : str);

/**
 * [_hashByString description]
 * @param {string} str
 * @return {string} [description]
 */
const _hashByString = (str) => {
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
 * Build files map sync
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
module.exports.filesMapSync = globby.sync;

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
 * @param  {boolean}  loop  loop count
 * @return {[type]}         minified source
 */
module.exports.minify = _minify;

/**
 * Sprite creation
 * @param  {[type]} files [description]
 * @return {[type]}       [description]
 */
module.exports.createSprite = _createSprite;
