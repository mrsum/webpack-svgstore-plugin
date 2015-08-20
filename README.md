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
### Append gotten sprites by ajax with custom formatting dynamically to some file - Comming soon
#
#