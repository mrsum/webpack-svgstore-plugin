"use strict";

// Depends
var path = require("path");
var SvgStore = require("../src/svgstore");

module.exports = function(_path) {
  // define local variables
  var distPath = path.join(_path, "platform", "dist");

  return {
    mode: "development",
    devtool:'source-map',
    entry: {
      app: path.join(_path, "platform", "static", "js", "index.js"),
    },
    output: {
      path: distPath,
      filename: "[name].js",
      chunkFilename: "[chunkhash].[id].js",
      publicPath: "/platform/",
    },
    resolve: {
      extensions: [".js"],
    },
    plugins: [
      // create svgStore instance object
      new SvgStore.Options({
        // svgo options
        svgoOptions: {
          plugins: [
            "removeTitle",
          ],
        },
      }),
    ],
  };
};
