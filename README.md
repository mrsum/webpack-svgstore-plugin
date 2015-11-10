# webpack-svgstore-plugin

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
    ajaxWrapper: {
      name: 'svg/[hash].svgxhr.js'
    }
  })
]

```

#### 2. Include svgxhr.js into your webpage

```html
  <script src="/assets/svgxhr.js" type="text/javascript" charset="utf-8"></script>
```

#### 3. HTML code for happy using

```html
  <svg class="svg-icon">
    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-name"></use>
  </svg>
```

## License

NPM package avaliable here: [webpack-svgstore-plugin](https://www.npmjs.com/package/webpack-svgstore-plugin)

MIT © [Chernobrov Mike](http://mrsum.ru), Gordey Levchenko