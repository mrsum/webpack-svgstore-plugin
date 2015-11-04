
/**
 * Format file
 */
var Format = function() {
  var self = this;
};

/**
 * Slim format
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
Format.prototype.slim = function(path) {
  var slim = {};
  slim.each = function(path) {
    return 'svgXHR("/assets/' + path + '");\n';
  };

  return slim;
};

module.exports = Format;
