const path = require("path");

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
};
