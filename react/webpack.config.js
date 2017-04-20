const webpack = require('webpack')
const path = require('path')


const port = process.env['PORT'] || 8080;
const host = process.env['HOST'] || 'localhost';
const flask_port = process.env['FLASK_PORT'] || 7000;

module.exports = (env) => {
  const production = env === 'prod';

  let config = {
    //devtool: 'source-map',
    //devtool: 'cheap-module-eval-source-map',
    devtool: 'inline-source-map',
    entry: {
      'app': [
        'react-hot-loader/patch',
        'babel-polyfill',
        './src/index'
      ],
      'videochat': [
        'react-hot-loader/patch',
        'babel-polyfill',
        './src/videochat'
      ]
    },
    output: {
      publicPath: '/static/react/',
      path: path.resolve(__dirname, '../static/react'),
      filename: '[name].bundle.js'
    },
    resolve: {
      modules: [
        path.resolve('../static/js'),
        path.resolve('./src'),
        path.resolve("node_modules"),
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
    },
    plugins: [
    ],
    externals: {
      'Config': JSON.stringify(production ? require('./config/prod.json') : require('./config/dev.json'))
    }
  }

  if (production) {
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        mangle: {
            screw_ie8: true,
            keep_fnames: true
        },
        compress: {
            screw_ie8: true
        },
        comments: false
      })
    );

    Object.keys(config.entry).filter(function(k, i) {
      config.entry[k].shift();
    });

    config.devtool = 'source-map';
  }

  return config;
}
