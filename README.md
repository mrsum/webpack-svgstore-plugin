```javascript

...
//load plugins
plugins: [
  //create svg sprite from /path/to/*.svg
  new SvgStore('/path/to/folder/svg', '/path/to/output/sprite.svg'), {
    prefix: 'icon-',
    svg: {
      style: 'position:absolute; width:0; height:0',
      xmlns: 'http://www.w3.org/2000/svg'
    }
  })
]


```