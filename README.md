# webpack-svgstore-plugin
![webpack-svgstore-plugin](https://lincolnloop.global.ssl.fastly.net/uploads/uploads/demo.png)

[![Build Status](https://travis-ci.org/mrsum/webpack-svgstore-plugin.svg?branch=master)](https://travis-ci.org/mrsum/webpack-svgstore-plugin)
[![NPM version](https://badge.fury.io/js/webpack-svgstore-plugin.svg)](https://badge.fury.io/js/webpack-svgstore-plugin)
[![Code Climate](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/gpa.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin)
[![Test Coverage](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/coverage.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/coverage)

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## Usage

#### 1. require plugin
```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');

module.exports = {
  entry: {
    app: path.join(_path, 'platform', 'static', 'js', 'index.js'),
  },
  plugins: [
    new SvgStore(path.join(sourcePath, 'svg', '**/*.svg'), path.join(distPath, 'svg'), {
      name: '[hash].sprite.svg',
      chunk: 'app',
      baseUrl: '//path-to-cdn:port/'
      prefix: 'myprefix-',
      svgoOptions: {
        // options for svgo, optional
      }
    })
  ]
}
```
`name` - sprite name

`chunk` - add xhr to entry point chunk (optional) 

`baseUrl` - server where the sprites are stored, for example a CDN (optional, default: `'window.location'` OR window.baseUrl if set)

`prefix` - add prefix to svg id's (optional, default: `'icon-'`)

`svgoOtions` - options for svgo (optional, default: `{}`)

#### 2. HTML code for happy using

```html
  <svg class="svg-icon">
    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-name"></use>
  </svg>
```

## License

NPM package avaliable here: [webpack-svgstore-plugin](https://www.npmjs.com/package/webpack-svgstore-plugin)

MIT © [Chernobrov Mike](http://mrsum.ru), Gordey Levchenko
