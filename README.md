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
  new SvgStore(path.join(sourcePath, 'min'), path.join(distPath, 'svg'), {
    name: '[hash].sprite.svg',
    ajaxWrapper: {
      name: '[hash].svgxhr.js'
    }
  })
]

```
