# webpack-svgstore-plugin
![webpack-svgstore-plugin](https://lincolnloop.global.ssl.fastly.net/uploads/uploads/demo.png)

[![Build Status](https://travis-ci.org/mrsum/webpack-svgstore-plugin.svg?branch=master)](https://travis-ci.org/mrsum/webpack-svgstore-plugin)
[![NPM version](https://badge.fury.io/js/webpack-svgstore-plugin.svg)](https://badge.fury.io/js/webpack-svgstore-plugin)
[![Code Climate](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/gpa.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin)
[![Test Coverage](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/coverage.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/coverage)

[![NPM](https://nodei.co/npm/webpack-svgstore-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/webpack-svgstore-plugin/)

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## Usage

#### 1) require plugin
```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');

module.exports = {
  entry: {
    app: path.join(_path, 'platform', 'static', 'js', 'index.js'),
  },
  plugins: [
    new SvgStore(
      //=========> input path
      [
        path.join(sourcePath, 'svg', '**/*.svg'),
        '!' + path.join(sourcePath, 'svg', 'excludeFolder', '**/*.svg'),
      ],
      //=========> output path
      'svg',
      //=========> options
    {
        name: '[hash].sprite.svg',
        chunk: 'app',
        baseUrl: '//path-to-cdn:port/',
        prefix: 'myprefix-',
        svgoOptions: {
          plugins: [
            { removeTitle: true }
          ]
        }
      }
    )
  ]
}
```
#### 2) html code for happy using

```html
  <svg class="svg-icon">
    <use xlink:href="#icon-name"></use>
  </svg>
```
## Plugin settings

#### input path
- path to folder with svgs, use [globby](https://github.com/sindresorhus/globby) patterns

#### output path
- path to output folder, begins with webpack `publicPath`

#### options
- `name` - sprite name 
- `chunk` - add xhr to entry point chunk (optional) 
- `baseUrl` - server where the sprites are stored, for example a CDN (optional)
- `prefix` - add prefix to svg id's (optional, default: `'icon-'`)
- `svgoOptions` - options for [svgo](https://github.com/svg/svgo) (optional, default: `{}`)

## License

NPM package available here: [webpack-svgstore-plugin](https://www.npmjs.com/package/webpack-svgstore-plugin)

MIT © [Chernobrov Mike](http://mrsum.ru), [Gordey Levchenko](https://github.com/lgordey)
