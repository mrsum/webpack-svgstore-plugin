
var Format = function() {
  var _this = this;
};

Format.prototype.slim = function(path) {
  var slim = {};

  slim.each = function(path) {
    return 'svgXHR("/assets/' + path + '");\n';
  }

  return slim
};

module.exports = Format;
