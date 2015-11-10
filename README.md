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

plugins: [
  new SvgStore(path.join(sourcePath, 'svg'), path.join(distPath, 'svg'), {
    name: 'svg/[hash].sprite.svg',
    ajaxWrapper: {
      name: 'svg/[hash].svgxhr.js'
    }
  })
]

```
