const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  node:  {
    fs: 'empty',
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: "javascript/auto",
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      }
    ],
  },
  plugins: [
    new CopyWebpackPlugin([{
      from: '../lib/wasm/*.wasm',
      to: 'wasm/[name].wasm',
    }]),
  ],
};
