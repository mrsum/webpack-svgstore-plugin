/**
 * Load svg via ajax
 *
 * @param  {string} url path to svg sprite
 * @generator: webpack-svgstore-plugin
 * @see: https://www.npmjs.com/package/webpack-svgstore-plugin
 * @return {[type]}     [description]
 */

function svgXHR(options) {
  let url = (options && options.filename) ? options.filename : null;

  if (!url) {
    return false;
  }
  const ajax = new XMLHttpRequest();

  if (options.addBaseUrl){
    let baseUrl;
    if (typeof baseUrl === 'undefined') {
      if (typeof window.baseUrl !== 'undefined') {
        baseUrl = window.baseUrl;
      } else {
        baseUrl =
          window.location.protocol +
          '//' +
          window.location.hostname +
          (window.location.port ? ':' + window.location.port : '');
      }
    }
    url = baseUrl+ '/' + url;
  }
  const fullPath = url.replace(/([^:]\/)\/+/g, '$1');

  ajax.open('GET', fullPath, true);

  ajax.onload = function () {
    if (!ajax.responseText || ajax.responseText.substr(0, 4) !== "<svg") {
      throw Error("Invalid SVG Response");
    }
    if (ajax.status < 200 || ajax.status >= 300) {
      return;
    }
    const div = document.createElement("div");
    div.innerHTML = ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
  ajax.send();
}

module.exports = svgXHR;
