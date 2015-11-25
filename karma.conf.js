var argv = require('yargs')
  .boolean('y')
  .alias('y', 'singleRun')
  .argv;

var singleRun = argv.y;

module.exports = function (config) {
  var options = {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'browserify', 'chai-as-promised', 'chai', 'sinon-chai', 'jsmockito-jshamcrest'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-core/browser-polyfill.js',
      'test/**/*.spec.js'
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.spec.js': ['browserify']
    },

    browserify: {
      debug: true,
      transform: [require('browserify-babel-istanbul'), 'babelify'],
      plugin: ['proxyquireify/plugin']
    },

    plugins: [
      'karma-spec-reporter',
      'karma-coverage',
      'karma-browserify',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-chai',
      'karma-chai-as-promised',
      'karma-sinon-chai',
      'karma-jsmockito-jshamcrest'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: [
      'spec',
      'coverage'
    ],

    coverageReporter: {
      dir: './build/coverage',
      reporters: [
        {
          file: 'lcov.txt',
          type: 'lcovonly'
        },
        {
          file: 'cobertura.txt',
          type: 'cobertura'
        },
        {
          file: 'teamcity.txt',
          type: 'teamcity'
        },
        {
          file: 'table.txt',
          type: 'text'
        },
        {
          file: 'summary.txt',
          type: 'text-summary'
        }
      ]
    },


    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'PhantomJS'
    ],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: singleRun
  };

  config.set(options);

  return options;
};
