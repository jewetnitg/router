/**
 * @author rik
 */
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var packageJson = require('../package.json');

module.exports = function (gulp) {

  gulp.task('browserify', function () {
    return doBrowserify(packageJson.browserify);
  });

  function doBrowserify(options) {
    var bundler = browserify(options);

    return bundler.bundle()
      .on('error', function (err) {
        console.error(err);
        this.emit('end');
      })
      .pipe(source('main.js'))
      .pipe(gulp.dest('./build/dst'));
  }
};