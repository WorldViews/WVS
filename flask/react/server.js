var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

var port = parseInt(process.env['PORT']) || 8080;
var flask_port = process.env['FLASK_PORT'] || 7000;

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true,
  proxy: [{
    context: ['**'],
    target: 'http://localhost:' + flask_port
  }]
}).listen(port, 'localhost', function (err, result) {
  if (err) {
    return console.log(err);
  }

  console.log('Listening at http://localhost:' + flask_port);
});
