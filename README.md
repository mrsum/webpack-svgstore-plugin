# Webpack-svgstore-plugin

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## Usage
```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');
...
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
    prefix: 'icon-',
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
### Append gotten sprites by ajax dynamically to slim template (now only this option)
#### To use this you should already have ajax function like:
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
#### Sprite.slim after compilation will look like:
```slim
javascript:
  svgXHR("/assets/svg/4bb06d6b0c535a0e4943116fc1839786.logo_sprite.svg");
  svgXHR("/assets/svg/0ef8d5339b99146be75c01d440b7b90d.sprite.svg");
```
#### And webpack.config.js:
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
    appendPath: path.join(_path, 'app', 'views', 'shared', '_sprite.html.slim'),
    min: true,
    loop: 2
  })
```
