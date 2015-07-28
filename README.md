# Webpack-svgstore-plugin

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## Usage
### webpack.config.js
#### 1) require plugin
```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');
```
#### 2) in plugins section
```javascript
//webpack.config.js

//load plugins
plugins: [

  //create svg sprite from /path/to/*.svg
  new SvgStore(path.join(_path + '/app/assets/svg'), {
  
    // svg prefix
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    
    //output section
    output: [
    
      // you can create 1 or multiply sprites
      {
        // filter by prefix
        filter: 'Logo-',
        // add md5 hash to file name
        sprite: 'svg/[hash].logo_sprite.svg'
      },
      {
        // except filter - all except 'Logo-'
        filter: 'except-Logo-',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    
    // append svgXHR function to call sprite
    append: true, // deafult: false
    appendPath: path.join(_path, 'app', 'views', 'shared', '_sprite.html.slim'), // path to file
    loop: 2,
    min: true
  })
]
```
## Examples
### 1 sprite for all svg's
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'all', // to get all svg's
        sprite: 'svg/sprite.svg'
      }
    ]
  })
```
### Add prefix
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-', // add prefix
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'all', // to get all svg's
        sprite: 'svg/sprite.svg'
      }
    ]
  })
```
### Add hash to output sprite
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'all',
        sprite: 'svg/[hash].sprite.svg' // hash
      }
    ]
  })
```
### Minify sprite
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'all',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    min: true // default: false
  })
```
### Add loop quantity for minify (svgo)
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'all',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    min: true,
    loop: 2 // default: 1 - sometimes need more than one
  })
```
### Get 2 different sprites by filter
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        // 1 sprite with all svgs which name contains 'Logo-' 
        filter: 'Logo-',
        sprite: 'svg/[hash].logo_sprite.svg'
      },
      {
        // 2 sprite with all other svg except names contains 'Logo-'
        filter: 'except-Logo-',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    min: true,
    loop: 2
  })
```
### Append gotten sprites by ajax with custom formatting dynamically to some file
##### Now there is only one option from the box - `slim`, but you can use your custom format function
#
#
#### So you have 2 ways to do it:
#
#
#### 1. Use default `slim` format
##### 1) You should have some slim template with your ajax code to append sprite to body, e.g.:
#
```slim
javascript:
  function svgXHR(url) {
    var _ajax = new XMLHttpRequest();
    _ajax.open('GET', url, true);
    _ajax.send();
    _ajax.onload = function(e) {
      var div = document.createElement('div');
      div.innerHTML = _ajax.responseText;
      document.body.insertBefore(div, document.body.childNodes[0]);
    }
  }

=render 'shared/sprite'
```
##### So in this case `shared/sprite` is a slim tempalte where I'll call my ajax function with right url
#
##### 2) And webpack config will look like:
#
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'Logo-',
        sprite: 'svg/[hash].logo_sprite.svg'
      },
      {
        filter: 'except-Logo-',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    append: true, //turn ON append mechanic, default: false 
    appendPath: path.join(_path, 'app', 'views', 'shared', '_sprite.slim'), // file path for appending
    format: 'slim', // turn ON slim template
    min: true,
    loop: 2
  })
```
#### `_sprite.slim` after compilation will look like:
```slim
javascript:
  svgXHR("/assets/svg/4bb06d6b0c535a0e4943116fc1839786.logo_sprite.svg");
  svgXHR("/assets/svg/0ef8d5339b99146be75c01d440b7b90d.sprite.svg");
```
#
#
#### 2. Use custom format function:
##### 1) You should have js ajax function like this somewhere (you can write your own):
#
```javascript
  function myAjaxFunction(url) {
    var ajax = new XMLHttpRequest();
    ajax.open('GET', url, true);
    ajax.send();
    ajax.onload = function(e) {
      var div = document.createElement('div');
      div.innerHTML = ajax.responseText;
      document.body.insertBefore(div, document.body.childNodes[0]);
    }
  }
```
##### 2) You should write your own format function script, e.g. `customFormat.js`:
#
```javascript

'use strict';

module.exports = function() {
  var output = {};

  output.start = '';
  output.each = function(path) {
    return 'myAjaxFunction("' + path + '");\n'
  }

  return output;
}
```
##### 3) Add your script to webpack.config.js and to format plugin, e.g.
#
```javascript
var format      = require('./helpers/customFormat');
```
```javascript
  new SvgStore(path.join(_path + '/app/assets/svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [
      {
        filter: 'Logo-',
        sprite: 'svg/[hash].logo_sprite.svg'
      },
      {
        filter: 'except-Logo-',
        sprite: 'svg/[hash].sprite.svg'
      }
    ],
    append: true,
    appendPath: path.join(_path, 'app', 'assets', 'javascript', 'ajax.js'), // file path for appending
    format: format, // get format from your customFunction
    min: true,
    loop: 2
  })
```
### 
