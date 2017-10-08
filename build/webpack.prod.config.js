/* eslint-disable import/no-commonjs, import/no-extraneous-dependencies */
const common = require( './common' );
const CleanWebpackPlugin = require( 'clean-webpack-plugin' );

const path = require( 'path' );
const __rootdir = path.join( __dirname, '../' );

const { config } = common;

module.exports = {
  entry: [
    ...config.entry,
  ],

  output: config.output,

  resolve: config.resolve,
  module: config.module,

  plugins: [
    new CleanWebpackPlugin( [ 'dist' ], {
      root: __rootdir,
    } ),
    ...config.plugins,
  ],

  devtool: 'eval',
};
