'use strict';

require('./test-2.js');

webpackSvgStore('platform/static/test/svg/**/*.svg', 'dist/svg1/[hash].logos.svg');
