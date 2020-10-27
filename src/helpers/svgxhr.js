/**
 * Load svg via ajax
 * @generator: svgstore-webpack-plugin
 * @see: https://www.npmjs.com/package/svgstore-webpack-plugin
 * @return {boolean}     [description]
 * @param {object} options
 * @param {string} [options.filename]
 * @param {boolean} [options.addBaseUrl]
 */
const svgXHR = (options) => {
  let url;

  url = options && options.filename ? options.filename : null;

  if (!url) {
    return false;
  }
  const ajax = new XMLHttpRequest();

  if (options.addBaseUrl) {
    let baseUrl;
    if (typeof baseUrl === 'undefined') {
      if (typeof window.baseUrl !== 'undefined') {
        baseUrl = window.baseUrl;
      } else {
        baseUrl = `${window.location.protocol}//${window.location.hostname}${
          window.location.port ? `:${window.location.port}` : ''
        }`;
      }
    }
    url = `${baseUrl}/${url}`;
  }
  const fullPath = url.replace(/([^:]\/)\/+/g, '$1');

  ajax.open('GET', fullPath, true);

  ajax.onload = () => {
    if (!ajax.responseText || ajax.responseText.substr(0, 4) !== '<svg') {
      throw Error('Invalid SVG Response');
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
 * @return void
 * @param callback
 */
function domready(callback) {
  if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

export default svgXHR;
