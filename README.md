```bash
npm i webpack-svgstore-plugin --save-dev
```


```javascript
//webpack.config.js

var SvgStore = require('webpack-svgstore-plugin');
...
//load plugins
plugins: [

  //create svg sprite from /path/to/*.svg
  new SvgStore('/path/to/folder/svg', '/path/to/output/sprite.svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    },
    output: [{
        svg: 'Logo-',
        sprite: path.join(_path + '/public/assets/svg/_logo_sprite.html')
      }, 
      {
        svg: 'others',
        sprite: path.join(_path + '/public/assets/svg/_sprite.html')
      },
  	  {
        svg: 'all',
        sprite: path.join(_path + '/public/assets/svg/_sprite.html')
      }
    ],
    loop: 2,
    min: true
  })
]


```