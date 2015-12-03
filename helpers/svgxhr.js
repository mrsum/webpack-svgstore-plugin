/**
 * Load svg via ajax
 * @param  {string} url path to svg sprite
 * @generator: webpack-svgstore-plugin
 * @see: https://www.npmjs.com/package/webpack-svgstore-plugin
 * @return {[type]}     [description]
 */
function svgXHR(url, baseUrl) {
  var _ajax = new XMLHttpRequest();

  if (typeof baseUrl === 'undefined') {
  	if (typeof window.baseUrl !== 'undefined') {
  		baseUrl = window.baseUrl;
  	} else {
  		baseUrl = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  	}
  }

  _ajax.open('GET', baseUrl + url, true);
  _ajax.send();
  _ajax.onload = function() {
    var div = document.createElement('div');
    div.innerHTML = _ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
}
