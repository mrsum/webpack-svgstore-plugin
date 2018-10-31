/**
 * Load svg via ajax
 * @param  {string} url path to svg sprite
 * @generator: webpack-svgstore-plugin
 * @see: https://www.npmjs.com/package/webpack-svgstore-plugin
 * @return {[type]}     [description]
 */
const svgXHR = function (options) {
  let url;

  url = (options && options.filename) ? options.filename : null;

  if (!url) {
    return false;
  }
  const ajax = new XMLHttpRequest();

  const fullPath = url.replace(/([^:]\/)\/+/g, '$1');

  ajax.open('GET', fullPath, true);

  ajax.onload = function () {
    if (!ajax.responseText || ajax.responseText.substr(0, 4) !== "<svg") {
      throw Error("Invalid SVG Response");
    }
    if (ajax.status < 200 || ajax.status >= 300) {
      return;
    }
    const div = document.createElement('div');
    div.innerHTML = ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
  ajax.send();
};

/**
 * jQuery like $.ready function.
 *
 * @param {Function} fn
 * @return void
 */
function domready(callback) {
  if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

module.exports = svgXHR;
