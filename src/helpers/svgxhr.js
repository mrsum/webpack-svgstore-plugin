/**
 * Load svg via ajax
 * @param  {string} url path to svg sprite
 * @generator: webpack-svgstore-plugin
 * @see: https://www.npmjs.com/package/webpack-svgstore-plugin
 * @return {[type]}     [description]
 */
var svgXHR = function (options) {
  var url = false;
  var baseUrl = undefined;

  options && options.filename
    ? url = options.filename
    : null;

  if (!url) return false;
  var _ajax = new XMLHttpRequest();
  var _fullPath;

  if (typeof XDomainRequest !== 'undefined') {
    _ajax = new XDomainRequest();
  }

  if (url.indexOf('http') !== 0) {
    if (typeof baseUrl === 'undefined') {
      if (typeof window.baseUrl !== 'undefined') {
        baseUrl = window.baseUrl;
      } else {
        baseUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      }
    }
    baseUrl = baseUrl + '/';
  }

  _fullPath = ((baseUrl || '') + url).replace(/([^:]\/)\/+/g, '$1');
  _ajax.open('GET', _fullPath, true);
  _ajax.onprogress = function () { };
  _ajax.onload = function () {
    if (!_ajax.responseText || _ajax.responseText.substr(0, 4) !== "<svg") {
      throw Error("Invalid SVG Response");
    }
    if (_ajax.status < 200 || _ajax.status >= 300) {
      return;
    }
    var div = document.createElement('div');
    div.innerHTML = _ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
  _ajax.send();
};

module.exports = svgXHR;
