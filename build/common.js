/* eslint-disable import/no-commonjs, import/no-extraneous-dependencies */
const path = require( 'path' );
const webpack = require( 'webpack' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const FaviconsWebpackPlugin = require( 'favicons-webpack-plugin' );
const BundleAnalyzerPlugin = require( 'webpack-bundle-analyzer' ).BundleAnalyzerPlugin;

const analyseBundle = process.env.ANALYSE_BUNDLE || false;
const isPhaser = context => ( context.indexOf( 'phaser' ) >= 0 || context.indexOf( 'p2' ) >= 0 || context.indexOf( 'pixi' ) >= 0 );

const iP = process.env.NODE_ENV === 'production';

const __rootdir = path.join( __dirname, '../' );

const HtmlWebpackPluginConfig = {
  filename: 'index.html',
  template: path.join( __rootdir, 'static/index.html' ),
};

module.exports = {
  iP,
  port: process.env.PORT || 9000,
  config: {
    entry: [
      path.join( __rootdir, 'src/index.js' ),
      path.join( __rootdir, 'src/phaser.js' ),
    ],

    output: {
      path: path.join( __rootdir, 'dist' ),
      filename: 'scripts/game.[name].[hash:8].js',
      sourceMapFilename: '[name].[hash:8].map',
      chunkFilename: '[id].[hash:8].js',
    },

    resolve: {
      extensions: [ '.js' ],
      alias: {
        pixi: path.join( __rootdir, 'node_modules/phaser/build/custom/pixi.js' ),
        phaser: path.join( __rootdir, 'node_modules/phaser/build/custom/phaser-split.js' ),
        p2: path.join( __rootdir, 'node_modules/phaser/build/custom/p2.js' ),
        assets: path.join( __rootdir, 'static/assets/' ),
        styles: path.join( __rootdir, 'static/styles/' ),
      },
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: [ 'style-loader', 'css-loader' ],
        },
        {
          test: /assets(\/|\\)/,
          loader: 'file-loader?name=static/[hash].[ext]',
        },
        {
          test: /pixi\.js$/, loader: 'expose-loader?PIXI',
        },
        {
          test: /phaser-split\.js$/, loader: 'expose-loader?Phaser',
        },
        {
          test: /p2\.js$/, loader: 'expose-loader?p2',
        },
      ],
    },

    plugins: [
      ( analyseBundle ? new BundleAnalyzerPlugin( {
        analyzerMode: 'static',
      } ) : () => {} ),
      new webpack.optimize.CommonsChunkPlugin( {
        name: 'phaser',
        filename: 'scripts/phaser.[hash].js',
        minChunks( module ) {
          var context = module.context;
          return context && isPhaser( context );
        },
      } ),

      new HtmlWebpackPlugin( HtmlWebpackPluginConfig ),
      new webpack.DefinePlugin( {
        'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV || 'development' ),
      } ),
      new FaviconsWebpackPlugin( {
        logo: './static/favicon.png',
        prefix: 'icons-[hash]/',
        emitStats: false,
        statsFilename: 'iconstats-[hash].json',
        persistentCache: true,
        inject: true,
        background: '#000',
        title: 'Project Nostradamus',

        icons: {
          android: true,
          appleIcon: true,
          appleStartup: false,
          coast: false,
          favicons: true,
          firefox: true,
          opengraph: false,
          twitter: false,
          yandex: false,
          windows: false,
        },
      } ),
    ],
  },
};
