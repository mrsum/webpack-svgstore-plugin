
var Format = function() {
  var _this = this;
};

Format.prototype.slim = function(path) {
  var slim = {};

  slim.start = 'javascript:\n';
  slim.each = function(path) {
    return '\tsvgXHR("/assets/' + path + '");\n';
  }

  return slim
};

module.exports = Format;
