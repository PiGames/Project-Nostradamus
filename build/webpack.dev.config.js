/* eslint-disable import/no-commonjs, import/no-extraneous-dependencies */
const webpack = require( 'webpack' );
const FriendlyErrorsPlugin = require( 'friendly-errors-webpack-plugin' );
const common = require( './common' );

const { config, port } = common;

module.exports = {
  entry: [
    ...config.entry,
    'webpack/hot/only-dev-server',
    `webpack-dev-server/client?http://localhost:${port}`,
  ],

  output: config.output,

  resolve: config.resolve,
  module: config.module,

  devServer: {
    port: port,
    hot: true,
    overlay: true,
    quiet: true,
  },

  plugins: [
    ...config.plugins,
    new webpack.HotModuleReplacementPlugin(),
    new FriendlyErrorsPlugin(),
  ],

  devtool: 'cheap-module-eval-source-map',
};
