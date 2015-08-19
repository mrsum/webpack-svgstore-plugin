'use strict';

/**
 * Webpack SVGstore plugin based on grunt-svg-store
 * @see https://github.com/FWeinb/grunt-svgstore/blob/master/tasks/svgstore.js
 */

// Depends
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var walk = require('walk');
var crypto = require('crypto');
var cheerio = require('cheerio');
var beautify = require('js-beautify').html;
var SVGO = require('svgo');
var Format = require('./format');
var others = [];

// Matching an url() reference. To correct references broken by making ids unique to the source svg
var urlPattern = /url\(\s*#([^ ]+?)\s*\)/g;

/**
 * SvgStore webpack plugin
 * @param string input   Destination path
 * @param string output  Output path
 * @param object options Object of options
 */
var SvgStore = function(input, options) {
  // Default function used to extract an id from a name
  var defaultConvertNameToId = function(name) {
    var _name = name;
    var dotPos = name.indexOf('.');
    if (dotPos > -1) {
      _name = name.substring(0, dotPos);
    }

    return _name;
  };

  var _default = {
    prefix: '',
    svg: {
      xmlns: 'http://www.w3.org/2000/svg'
    },
    symbol: {},
    formatting: false,
    output: [
      {
        filter: 'all', // 'all', 'except Logo-' (except prefix), 'logo-' (prefix)
        sprite: 'sprite.svg' // path to sprite with full name
      }
    ],
    format: 'slim',
    append: false,
    appendPath: '',
    ajaxFunc: '',
    manifest: {
      update: false,
      path: ''
    },
    loop: 1,
    min: false,
    minDir: 'min',
    inheritviewbox: false,
    cleanupdefs: false,
    convertNameToId: defaultConvertNameToId,
    fixedSizeVersion: false,
    includeTitleElement: true,
    preserveDescElement: true
  };

  this.files = [];
  this.options = _.extend(_default, options);

  this.input = input;

  if (options.cleanup && typeof options.cleanup === 'boolean') {
    // For backwards compatibility (introduced in 0.2.6).
    cleanupAttributes = ['style'];
  } else if (Array.isArray(options.cleanup)) {
    cleanupAttributes = options.cleanup;
  }
};

/**
 * svgMin
 * @param string input   Destination path
 * @param string output  Output path
 * @param string minDir  SVG path for optimization
 * @param string temp    Temp svg's path
 * @param string loop    Optimize loop times
 */
SvgStore.prototype.svgMin = function(file, loop) {
  var svgo = new SVGO();
  var source = file;
  var i;

  function svgoCallback(result) {
    source = result.data;
  }

  // optimize loop
  for (i = 1; i <= loop; i++) {
    svgo.optimize(source, svgoCallback);
  }

  return source;
};

/**
 * Build files map
 * @param  {string} input Destination path
 * @return {array}        Array of paths
 */
SvgStore.prototype.filesMap = function(input, filter, cb) {

  // files
  var files = [];
  var exceptedPrefix = '';
  var except = false;

  // options
  var walkOptions = { followLinks: false };

  // Walker options
  var walker  = walk.walk(input, walkOptions);

  if (filter && filter.indexOf('except') != -1) {
    exceptedPrefix = filter.replace('except-', '');
    except = true;
  }

  // walker event
  walker.on('file', function(root, stat, next) {

    var curItem = root + '/' + stat.name;

    // prefix
    if (filter && stat.name.indexOf(filter) != -1) {
      files.push(curItem);

    // except prefix
    } else if (filter && filter.indexOf('except') != -1 && stat.name.indexOf(exceptedPrefix) == -1) {
      others.push(curItem);

    // all
    } else if (!filter) {
      files.push(curItem);
    }

    // goto next file
    next();

  });

  return walker.on('end', function() {
    cb(except ? others : files);
  });

};

SvgStore.prototype.hash = function(buffer, name) {
  return name.indexOf('[hash]') >= 0 ? name.replace('[hash]', crypto.createHash('md5').update(buffer).digest('hex')) : name
};

/**
 * Get file contents
 * @param  {[type]} arguments [description]
 * @return {[type]}           [description]
 */
SvgStore.prototype.parseFiles = function(files, min, sprite) {

  var _this = this;
  var options = this.options;
  var cleanupAttributes = [];

  if (options.cleanup && typeof options.cleanup === 'boolean') {
    cleanupAttributes = ['style'];
  } else if (Array.isArray(options.cleanup)) {
    cleanupAttributes = options.cleanup;
  }

  var $resultDocument = cheerio.load('<svg><defs></defs></svg>', { xmlMode: true });
  var $resultSvg = $resultDocument('svg');
  var $resultDefs = $resultDocument('defs').first();
  var iconNameViewBoxArray = [];

  // Merge in SVG attributes from option
  for (var attr in options.svg) {
    $resultSvg.attr(attr, options.svg[attr]);
  }

  files.forEach(function(file) {
    var filename = path.basename(file, '.svg');
    var id = options.convertNameToId(filename);

    var contentStr = fs.readFileSync(file, 'utf8');

    if (path.extname(file) === '.svg' && path.dirname(file).indexOf('/min') !== -1 && min) {
      // min svg's
      contentStr = _this.svgMin(contentStr, _this.options.loop);
    }

    var $ = cheerio.load(contentStr, {
      normalizeWhitespace: true,
      xmlMode: true
    });

    // Remove empty g elements
    $('g').each(function() {
      var $elem = $(this);
      if (!$elem.children().length) {
        $elem.remove();
      }
    });

    // Map to store references from id to uniqueId + id;
    var mappedIds = {};

    function getUniqueId(oldId) {
      return id + '-' + oldId;
    }

    $('[id]').each(function() {
      var $elem = $(this);
      var id = $elem.attr('id');
      var uid = getUniqueId(id);
      mappedIds[id] = {
        id: uid,
        referenced: false,
        $elem: $elem
      };
      $elem.attr('id', uid);
    });

    $('*').each(function() {

      var $elem = $(this);
      var attrs = $elem.attr();

      Object.keys(attrs).forEach(function(key) {

        var value = attrs[key];
        var id;
        var match;
        var preservedKey = '';

        while ((match = urlPattern.exec(value)) !== null) {
          id = match[1];
          if (!!mappedIds[id]) {
            mappedIds[id].referenced = true;
            $elem.attr(key, value.replace(match[0], 'url(#' + mappedIds[id].id + ')'));
          }
        }

        if (key === 'xlink:href') {
          id = value.substring(1);
          var idObj = mappedIds[id];
          if (!!idObj) {
            idObj.referenced = false;
            $elem.attr(key, '#' + idObj.id);
          }
        }

        // IDs are handled separately
        if (key !== 'id') {

          if (options.cleanupdefs || !$elem.parents('defs').length) {

            if (key.match(/preserve--/)) {
              //Strip off the preserve--
              preservedKey = key.substring(10);
            }

            if (cleanupAttributes.indexOf(key) > -1 || cleanupAttributes.indexOf(preservedKey) > -1) {

              if (preservedKey && preservedKey.length) {
                //Add the new key preserving value
                $elem.attr(preservedKey, $elem.attr(key));

                //Remove the old preserve--foo key
                $elem.removeAttr(key);
              }
              else if (!(key === 'fill' && $elem.attr('fill') === 'currentColor')) {
                // Letting fill inherit the `currentColor` allows shared inline defs to
                // be styled differently based on an xlink element's `color` so we leave these
                $elem.removeAttr(key);
              }
            } else {
              if (preservedKey && preservedKey.length) {
                //Add the new key preserving value
                $elem.attr(preservedKey, $elem.attr(key));

                //Remove the old preserve--foo key
                $elem.removeAttr(key);
              }
            }
          }
        }
      });

    });

    if (cleanupAttributes.indexOf('id') > -1) {
      Object.keys(mappedIds).forEach(function(id) {
        var idObj = mappedIds[id];
        if (!idObj.referenced) {
          idObj.$elem.removeAttr('id');
        }
      });
    }

    var $svg = $('svg');
    var $title = $('title');
    var $desc = $('desc');
    var $def = $('defs').first();
    var defContent = $def.length && $def.html();

    // Merge in the defs from this svg in the result defs block
    if (defContent) {
      $resultDefs.append(defContent);
    }

    var title = $title.first().html();
    var desc = $desc.first().html();

    // Remove def, title, desc from this svg
    $def.remove();
    $title.remove();
    $desc.remove();

    // If there is no title use the filename
    title = title || id;

    // Generate symbol
    var $res = cheerio.load('<symbol>' + $svg.html() + '</symbol>', { xmlMode: true });
    var $symbol = $res('symbol').first();

    // Merge in symbol attributes from option
    for (var attr in options.symbol) {
      $symbol.attr(attr, options.symbol[attr]);
    }

    // Add title and desc (if provided)
    if (desc && options.preserveDescElement) {
      $symbol.prepend('<desc>' + desc + '</desc>');
    }

    if (title && options.includeTitleElement) {
      $symbol.prepend('<title>' + title + '</title>');
    }

    // Add viewBox (if present on SVG w/ optional width/height fallback)
    var viewBox = $svg.attr('viewBox');

    if (!viewBox && options.inheritviewbox) {
      var width = $svg.attr('width');
      var height = $svg.attr('height');
      var pxSize = /^\d+(\.\d+)?(px)?$/;
      if (pxSize.test(width) && pxSize.test(height)) {
        viewBox = '0 0 ' + parseFloat(width) + ' ' + parseFloat(height);
      }
    }

    if (viewBox) {
      $symbol.attr('viewBox', viewBox);
    }

    // Add ID to symbol
    var graphicId = options.prefix + id;
    $symbol.attr('id', graphicId);

    // Extract gradients and pattern
    var addToDefs = function() {
      var $elem = $res(this);
      $resultDefs.append($elem.toString());
      $elem.remove();
    };

    $res('linearGradient').each(addToDefs);
    $res('radialGradient').each(addToDefs);
    $res('pattern').each(addToDefs);

    // Append <symbol> to resulting SVG
    $resultSvg.append($res.html());

    // Add icon to the demo.html array
    if (!!options.includedemo) {
      iconNameViewBoxArray.push({
            name: graphicId,
            title: title
          });
    }

    if (viewBox && !!options.fixedSizeVersion) {
      var fixedWidth = options.fixedSizeVersion.width || 50;
      var fixedHeight = options.fixedSizeVersion.width || 50;
      var $resFixed = cheerio.load('<symbol><use></use></symbol>', { lowerCaseAttributeNames: false });
      var fixedId = graphicId + (options.fixedSizeVersion.suffix || '-fixed-size');
      var $symbolFixed = $resFixed('symbol')
        .first()
        .attr('viewBox', [0, 0, fixedWidth, fixedHeight].join(' '))
        .attr('id', fixedId);
      Object.keys(options.symbol).forEach(function(key) {
        $symbolFixed.attr(key, options.symbol[key]);
      });

      if (desc) {
        $symbolFixed.prepend('<desc>' + desc + '</desc>');
      }

      if (title) {
        $symbolFixed.prepend('<title>' + title + '</title>');
      }

      var originalViewBox = viewBox
        .split(' ')
            .map(function(string) {
              return parseInt(string);
            });

      var translationX = ((fixedWidth - originalViewBox[2]) / 2) + originalViewBox[0];
      var translationY = ((fixedHeight - originalViewBox[3]) / 2) + originalViewBox[1];
      var scale = Math.max.apply(null, [originalViewBox[2], originalViewBox[3]]) /
        Math.max.apply(null, [fixedWidth, fixedHeight]);

      $symbolFixed
        .find('use')
        .attr('xlink:href', '#' + fixedId)
        .attr('transform', [
          'scale(' + parseFloat(scale.toFixed(options.fixedSizeVersion.maxDigits.scale || 4)).toPrecision() + ')',
          'translate(' + [
            parseFloat(translationX.toFixed(options.fixedSizeVersion.maxDigits.translation || 4)).toPrecision(),
            parseFloat(translationY.toFixed(options.fixedSizeVersion.maxDigits.translation || 4)).toPrecision()
          ].join(', ') + ')'
        ].join(' '));

      $resultSvg.append($resFixed.html());
    }
  });

  // Remove defs block if empty
  if ($resultDefs.html().trim() === '') {
    $resultDefs.remove();
  }

  // get result file
  return options.formatting
    ? beautify($resultDocument.html(), options.formatting)
    : $resultDocument.html();
};

/**
 * Consctructor
 * @param  {object} compiler WebPack compiler
 * @return {[type]}          [description]
 */
SvgStore.prototype.apply = function(compiler) {
  var _this = this;
  var spriteAjax = fs.readFileSync(_this.options.ajaxFunc, 'utf-8');
  var output = this.options.output;
  var oneForAll = output.length === 1 && output[0].filter === 'all';
  var outputData;

  if (typeof _this.options.format === 'string' || _this.options.format instanceof String) {
    var format = new Format();
    outputData = format[_this.options.format]();
  } else {
    outputData = _this.options.format();
  }

  output.forEach(function(key) {
    _this.filesMap(_this.input, oneForAll ? false : key.filter, function(files) {

      var source = _this.parseFiles(files, _this.options.min, key.sprite);

      key.sprite = _this.hash(source, key.sprite);

      compiler.plugin('emit', function(compilation, callback) {
        compilation.assets[key.sprite] = {
          source: function() { return new Buffer(source); },
          size: function() { return Buffer.byteLength(source, 'utf8'); }
        };
        callback();
      });

      spriteAjax += outputData.each(key.sprite);
    });
  });

  if (_this.options.append) {
    compiler.plugin('done', function(compilation, callback) {
      var path = _this.hash(spriteAjax, _this.options.appendPath);
      var filename = path.split("/").pop()

      if (_this.options.manifest.update) {
        // update manifest with sprite js
        var manifest = JSON.parse(fs.readFileSync(_this.options.manifest.path, 'utf-8'));
        manifest.assetsByChunkName.sprite = filename;
        var newManifest = JSON.stringify(manifest)

        // rewrite manifest
        fs.writeFile(_this.options.manifest.path, newManifest, 'utf8', function(err) {
          if (err) return console.log(err);
        });
      }

      // add js to output
      fs.writeFile(path, spriteAjax, 'utf8', function(err) {
        if (err) return console.log(err);
      });
    });
  }
};

module.exports = SvgStore;
