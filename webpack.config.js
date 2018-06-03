const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  node:  {
    fs: 'empty',
  },
  entry: path.resolve(__dirname, 'lib/index.js'),
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'index.js',
    library: '',
    libraryTarget: 'commonjs'
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['babel-preset-env', 'babel-preset-react']
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
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
      from: 'lib/wasm/*.wasm',
      to: 'wasm/[name].wasm',
    }]),
  ],
};
