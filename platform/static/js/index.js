'use strict';

// load icons tasks
webpackSvgStore('platform/static/svg/**/*.svg', '[hash].icons.svg');

require('./test/chunk.js');
