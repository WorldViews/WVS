const webpack = require('webpack')
const path = require('path')

const port = process.env['PORT'] || 8080;
const host = process.env['HOST'] || 'localhost';
const flask_port = process.env['FLASK_PORT'] || 7000;

module.exports = {
  //devtool: 'source-map',
  //devtool: 'cheap-module-eval-source-map',
  devtool: 'inline-source-map',
  entry: {
    'app': [
      'babel-polyfill',
      'react-hot-loader/patch',
      './src/index'
    ]
  },
  output: {
    publicPath: '/static/react/',
    path: path.resolve(__dirname, '../static/react'),
    filename: '[name].bundle.js'
  },
  resolve: {
    modules: [
      path.resolve("node_modules"),
      path.resolve('../static/js')
    ]
  },
  module: {
    rules: [
      {
        test: /bootstrap-sass\/assets\/javascripts\//,
        loader: 'imports?jQuery=jquery',
      }, {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff',
      }, {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff2',
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream',
      }, {
        test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-otf',
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file',
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml',
      }, {
        test: /\.js$/,
        loader: 'eslint-loader',
        exclude: /node_modules/,
        options: {
          useEslintrc: false,
          configFile: path.resolve('.eslintrc')
        }
      }, {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
      }, {
        test: /\.png$/,
        loader: 'file?name=[name].[ext]',
      }, {
        test: /\.jpg$/,
        loader: 'file?name=[name].[ext]',
      }, {
        test: /\.scss$/,
        loader: 'style!css!sass',
      }
    ],
  },
  resolveLoader: {
    moduleExtensions: ["-loader"]
  },  
  devServer: {
    host: host,
    port: port,
    proxy: [
      {
        context: ['**'],
        target: 'http://localhost:' + flask_port,
      }
    ]
  }
}
