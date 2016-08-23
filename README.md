# webpack svgstore plugin
![webpack-svgstore-plugin](http://mrsum.ru/blog/content/images/2016/07/webpack-svgstore-logo.png)
[![NPM](https://nodei.co/npm/webpack-svgstore-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/webpack-svgstore-plugin/)

## Package info
[![Build Status](https://travis-ci.org/mrsum/webpack-svgstore-plugin.svg?branch=master)](https://travis-ci.org/mrsum/webpack-svgstore-plugin)
[![NPM version](https://badge.fury.io/js/webpack-svgstore-plugin.svg)](https://badge.fury.io/js/webpack-svgstore-plugin)
[![Code Climate](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/gpa.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin)
[![Test Coverage](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/badges/coverage.svg)](https://codeclimate.com/github/mrsum/webpack-svgstore-plugin/coverage)

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## FAQ
#### require plugin
```javascript
//webpack.config.js
var SvgStore = require('webpack-svgstore-plugin');
module.exports = {
  plugins: [
    // create svgStore instance object
    new SvgStore({
      svgoOptions: {
        plugins: [
          // put svgo options for your own project
          { removeTitle: true }
        ]
      }
    })
  ]
}
```

#### generate sprite from folder
```javascript
// plugin will find marks and build sprite
var __svg__ = { path: './assets/svg/**/*.svg', name: 'assets/svg/[hash].logos.svg' };

// will overwrite to var __svg__ = { filename: "assets/svg/1466687804854.logos.svg" };
// also you can use next variables for sprite compile
// var __sprite__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].icons.svg' };
// var __svgstore__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].stuff.svg' };
// var __svgsprite__ = { path: './assets/svg/minify/*.svg', name: 'assets/svg/[hash].1logos.svg' };
```
*_All sprites will put relative ```publicPath``` string from ```webpack.config.js```_*


#### loading sprite via XMLHttpRequest
```javascript
// require basic or custom sprite loader
require('webpack-svgstore-plugin/src/helpers/svgxhr')(__svg__);
```
*_After loading you can see empty ```<div>``` into body page_*


#### different domains
```javascript
// if you are using CDN or different domain
require('webpack-svgstore-plugin/src/helpers/svgxhr')({
  filename: 'http://cdn.example.com/' + __svg__.filename
});

// es6
require('webpack-svgstore-plugin/src/helpers/svgxhr')({
  filename: `http://cdn.example.com/${__svg__.filename}`
});

```

#### sprite icon using

```html
<svg class="svg-icon">
  <use xlink:href="#icon-name"></use>
</svg>
```

## Example
```javascript
// webpack.config.js
'use strict';

// Depends
var path = require('path');
var SvgStore = require('../src/svgstore');

module.exports = function(path) {
  // define local variables
  var distPath = path.join(_path, 'platform', 'dist');
  var sourcePath = path.join(_path, 'platform', 'static');

  return {
    entry: {
      app: path.join(_path, 'platform', 'static', 'js', 'index.js')
    },
    output: {
      path: distPath,
      filename: '[chunkhash].[name].js',
      chunkFilename: '[chunkhash].[id].js',
      publicPath: '/platform/'
    },
    resolve: {
      extensions: ['', '.js'],
    },
    plugins: [
      // create svgStore instance object
      new SvgStore.Options({
        // svgo options
        svgoOptions: {
          plugins: [
            { removeTitle: true }
          ]
        }
      })
    ]
  };
};
```

## Plugin settings

#### options
- `template` - add custom jade template layout (optional)
- `svgoOptions` - options for [svgo](https://github.com/svg/svgo) (optional, default: `{}`)


```javascript
new SvgStore({
  template: '_path/to/your/template.pug' // path to your own template
  prefix: 'icon' // default prefix
})
```
## License
MIT © [Chernobrov Mike](http://mrsum.ru), [Gordey Levchenko](https://github.com/lgordey)
