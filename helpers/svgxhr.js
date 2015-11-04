/**
 * Load svg via ajax
 * @param  {string} url path to svg sprite
 * @generator: webpack-svgstore-plugin
 * @see: https://www.npmjs.com/package/webpack-svgstore-plugin
 * @return {[type]}     [description]
 */
function svgXHR(url) {
  var _ajax = new XMLHttpRequest();
  _ajax.open('GET', url, true);
  _ajax.send();
  _ajax.onload = function(e) {
    var div = document.createElement('div');
    div.innerHTML = _ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
}
