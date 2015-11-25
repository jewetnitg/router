var rimraf = require('rimraf');

module.exports = function (gulp) {
  gulp.task('clean', function (cb) {
    return rimraf('build', cb);
  });
};
