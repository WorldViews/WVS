module.exports = function(config) {
  config.set({

    basePath: './',

    frameworks: ['mocha', 'chai'],

    customLaunchers: {
      devChrome: {
        base: 'Chrome',
        // flags: []
        // flags: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
        flags: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
      }
    },

    files: [{
        pattern: '**/*.js.map',
        included: false
      },
      'test/test_index.js'
    ],
    preprocessors: {
       'test/test_index.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool : 'inline-source-map',
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    exclude: [],

    reporters: ['progress', 'mocha'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_WARN,

    autoWatch: false,

    browsers: ['devChrome'],

    singleRun: true,

    browserNoActivityTimeout: 60000,

    concurrency: Infinity,

    plugins: [
      'karma-mocha',
      'karma-chai',
      'karma-chrome-launcher',
      'karma-webpack',
      'karma-sourcemap-loader',
      'karma-mocha-reporter'
    ]
  })
};