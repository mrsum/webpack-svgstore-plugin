# webpack-svgstore-plugin
![webpack-svgstore-plugin](https://lincolnloop.global.ssl.fastly.net/uploads/uploads/demo.png)

## Installation
```bash
npm i webpack-svgstore-plugin --save-dev
```
## Usage

#### 1. require plugin
```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');

plugins: [
  new SvgStore(path.join(sourcePath, 'svg'), path.join(distPath, 'svg'), {
    name: 'svg/[hash].sprite.svg',
    chunk: 'app'
  })
]

```

#### 2. HTML code for happy using

```html
  <svg class="svg-icon">
    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-name"></use>
  </svg>
```

## License

NPM package avaliable here: [webpack-svgstore-plugin](https://www.npmjs.com/package/webpack-svgstore-plugin)

MIT © [Chernobrov Mike](http://mrsum.ru), Gordey Levchenko