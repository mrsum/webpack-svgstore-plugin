'use strict';

var __svg__ = { path: '../svg/**/Logo-*.svg', name: '[hash].logos.svg' };
// var __sprite__ = { path: '../svg/**/*.svg', name: 'test/for/svg/[hash].geckos.svg' };
// var __svgstore__ = { path: '../svg/**/*.svg', name: 'svg/[hash].icon.svg' };

require('../../../src/helpers/svgxhr')(__svg__);
