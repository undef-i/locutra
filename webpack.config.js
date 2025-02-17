const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/assets/js/main.js',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'public'),
    clean: true, 
    publicPath: '/',
    library: {
      name: 'Locutra',
      type: 'window'
    }
  },

  resolve: {
    extensions: ['.js', '.css']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/templates/index.html',
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'blocking',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true
      },
      wasmHash: webpack.hash
    }),
    new webpack.ProvidePlugin({
      echarts: 'echarts'
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "pkg/locutra_bg.wasm", 
          to: "." 
        }
      ],
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        echarts: {
          test: /[\\/]node_modules[\\/]echarts[\\/]/,
          name: 'vendor.echarts',
          chunks: 'all',
          priority: 10
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
          priority: -10
        }
      }
    },
    runtimeChunk: 'single',
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
  },
  performance: {
    hints: false,
    maxAssetSize: 50000000,
    maxEntrypointSize: 50000000,
  },
  stats: {
    warnings: false,
    colors: true
  },
  devServer: {
    client: {
      overlay: false
    },
    hot: true
  }
};