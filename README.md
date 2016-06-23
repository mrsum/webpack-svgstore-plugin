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
  plugins: [
    // create svgStore instance object
    new SvgStore({
      // svgo options
      svgoOptions: {
        plugins: [
          { removeTitle: true }
        ]
      }
    })
  ]
}
```

#### 2) put function mark at your chunk
```javascript
// plugin will find marks and build sprite

var __svg__ = { path: './assets/svg/**/*.svg', name: 'assets/svg/[hash].logos.svg' };
// will overwrite to var __svg__ = { filename: "assets/svg/1466687804854.logos.svg" };

// var __sprite__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].icons.svg' };
// var __svgstore__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].stuff.svg' };
// var __svgsprite__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].1logos.svg' };

// require basic or custom sprite loader
require('webpack-svgstore-plugin/src/helpers/svgxhr')(__svg__);
```

#### 3) html code for happy using

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
- `template` - add custom jade template layout (optional)
- `svgoOptions` - options for [svgo](https://github.com/svg/svgo) (optional, default: `{}`)

## License

NPM package available here: [webpack-svgstore-plugin](https://www.npmjs.com/package/webpack-svgstore-plugin)

MIT © [Chernobrov Mike](http://mrsum.ru), [Gordey Levchenko](https://github.com/lgordey)
